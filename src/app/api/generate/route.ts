import { NextResponse } from "next/server";
import { queuePrompt, COMFY_API_URLS, PromptResponse, ComfyWorkflow } from "@/lib/comfy";
import { rateLimit } from "@/lib/ratelimit";
import { auth } from "@/auth";

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

const BASE_WORKFLOW = {
    "3": {
        "inputs": {
            "seed": 0,
            "steps": 20,
            "cfg": 7,
            "sampler_name": "dpmpp_2m_sde",
            "scheduler": "karras",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
        },
        "class_type": "KSampler",
        "_meta": { "title": "KSampler" }
    },
    "4": {
        "inputs": {
            "ckpt_name": "illustrious-unholy-nswf.safetensors"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": { "title": "Load Checkpoint" }
    },
    "5": {
        "inputs": {
            "width": 1216,
            "height": 832,
            "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": { "title": "Empty Latent Image" }
    },
    "6": {
        "inputs": {
            "text": "",
            "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": { "title": "CLIP Text Encode (Prompt)" }
    },
    "7": {
        "inputs": {
            "text": "",
            "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode",
        "_meta": { "title": "CLIP Text Encode (Prompt)" }
    },
    "8": {
        "inputs": {
            "samples": ["3", 0],
            "vae": ["4", 2]
        },
        "class_type": "VAEDecode",
        "_meta": { "title": "VAE Decode" }
    },
    "17": {
        "inputs": {
            "filename": "%time_%basemodelname_%seed",
            "path": "",
            "extension": "webp",
            "lossless_webp": false,
            "quality_jpeg_or_webp": 90,
            "optimize_png": false,
            "embed_workflow": false,
            "save_workflow_as_json": false,
            "counter": 0,
            "time_format": "%Y-%m-%d-%H%M%S",
            "show_preview": true,
            "images": ["18", 0]
        },
        "class_type": "Image Saver Simple",
        "_meta": { "title": "Image Saver Simple" }
    },
    "18": {
        "inputs": {
            "upscale_method": "lanczos",
            "scale_by": 2,
            "image": ["8", 0]
        },
        "class_type": "ImageScaleBy",
        "_meta": { "title": "Upscale Image By" }
    }
};

export async function POST(request: Request) {
    try {
        const params = await request.json();

        // Rate Limit Check
        const session = await auth();
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

        // Use user ID if logged in, otherwise IP (though we block non-logged in users in middleware, this is safe)
        const identifier = session?.user?.email ?? ip;

        const { isRateLimited, limit, remaining } = await limiter.check(5, identifier); // 5 requests per minute per user

        if (isRateLimited) {
            return NextResponse.json(
                { success: false, error: "Rate limit exceeded. Please try again later." },
                { status: 429, headers: { "X-RateLimit-Limit": limit.toString(), "X-RateLimit-Remaining": remaining.toString() } }
            );
        }

        const workflow = JSON.parse(JSON.stringify(BASE_WORKFLOW));

        // Map params to workflow
        const seed = params.seed ?? Math.floor(Math.random() * 1000000000);
        workflow["3"].inputs.seed = seed;
        workflow["3"].inputs.steps = params.steps ?? 20;
        workflow["3"].inputs.cfg = params.cfg ?? 7;

        workflow["5"].inputs.width = params.width ?? 832;
        workflow["5"].inputs.height = params.height ?? 1216;

        workflow["6"].inputs.text = params.prompt;
        workflow["7"].inputs.text = params.negative_prompt ?? "low quality, bad anatomy, worst quality";

        // Queue to all APIs in parallel with different seeds
        const baseSeed = params.seed ?? Math.floor(Math.random() * 1000000000);
        const results = await Promise.allSettled(
            COMFY_API_URLS.map(async (apiUrl, index) => {
                // Clone workflow for each request
                const workflowCopy = JSON.parse(JSON.stringify(workflow));
                // Use different seed for each API
                workflowCopy["3"].inputs.seed = baseSeed + index;
                const queueRes = await queuePrompt(workflowCopy, apiUrl);
                return { promptId: queueRes.prompt_id, apiIndex: index };
            })
        );

        // Collect successful results
        const prompts = results
            .filter((r): r is PromiseFulfilledResult<{ promptId: string; apiIndex: number }> => r.status === "fulfilled")
            .map(r => r.value);

        if (prompts.length === 0) {
            const errors = results
                .filter((r): r is PromiseRejectedResult => r.status === "rejected")
                .map(r => r.reason);
            throw new Error(errors.join(", "));
        }

        return NextResponse.json({ success: true, prompts });
    } catch (error) {
        console.error("Generation failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
