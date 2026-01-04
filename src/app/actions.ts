"use server";

import { queuePrompt, getHistory, ComfyWorkflow, getImageUrl, COMFY_API_URLS } from "@/lib/comfy";
import OpenAI from "openai";

// Initialize OpenAI client for Grok
const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY || "",
    baseURL: process.env.GROK_BASE_URL || "https://api.x.ai/v1",
});

export async function chatWithGrok(messages: any[]) {
    try {
        const completion = await client.chat.completions.create({
            model: "grok-4-1-fast-non-reasoning",
            messages: messages,
        });
        return { success: true, message: completion.choices[0].message };
    } catch (error) {
        console.error("Grok error:", error);
        return { success: false, error: String(error) };
    }
}

export async function enhancePrompt(prompt: string, style?: string) {
    try {
        const systemPrompt = `You are an expert AI image prompt engineer. Your task is to enhance image generation prompts to produce better quality images.

Rules:
1. Enhance the prompt with more descriptive details, lighting, composition, and artistic style
2. Keep the core concept intact
3. Add quality tags like: masterpiece, best quality, highly detailed, 8k, professional
4. Return ONLY a JSON object with two fields: "prompt" and "negative_prompt"
5. The negative_prompt should contain things to avoid like: low quality, blurry, bad anatomy, etc.
6. Do not include any explanation, just the JSON object
${style ? `7. Apply the "${style}" art style to the prompt` : ""}

Example output format:
{"prompt": "enhanced prompt here", "negative_prompt": "negative tags here"}`;

        const completion = await client.chat.completions.create({
            model: "grok-4-1-fast-non-reasoning",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Enhance this prompt: "${prompt}"` }
            ],
        });

        const content = completion.choices[0].message.content || "";

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                prompt: parsed.prompt || prompt,
                negative_prompt: parsed.negative_prompt || ""
            };
        }

        return { success: false, error: "Failed to parse response" };
    } catch (error) {
        console.error("Enhance prompt error:", error);
        return { success: false, error: String(error) };
    }
}

// The base workflow provided by user
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

export type GenerationParams = {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg?: number;
    seed?: number;
}

export async function generateImage(params: GenerationParams) {
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

    try {
        // Queue to all APIs in parallel with different seeds
        const baseSeed = params.seed ?? Math.floor(Math.random() * 1000000000);
        const results = await Promise.allSettled(
            COMFY_API_URLS.map(async (apiUrl, index) => {
                // Clone workflow for each request
                const workflowCopy = JSON.parse(JSON.stringify(workflow));
                // Use different seed for each API
                workflowCopy["3"].inputs.seed = baseSeed + index;
                const queueRes = await queuePrompt(workflowCopy, apiUrl);
                return { promptId: queueRes.prompt_id, apiUrl };
            })
        );

        // Collect successful results
        const prompts = results
            .filter((r): r is PromiseFulfilledResult<{ promptId: string; apiUrl: string }> => r.status === "fulfilled")
            .map(r => r.value);

        if (prompts.length === 0) {
            const errors = results
                .filter((r): r is PromiseRejectedResult => r.status === "rejected")
                .map(r => r.reason);
            throw new Error(errors.join(", "));
        }

        return { success: true, prompts };
    } catch (error) {
        console.error("Generation failed:", error);
        return { success: false, error: String(error) };
    }
}

export interface ImageMetadata {
    prompt: string;
    negative_prompt: string;
    seed: number;
    steps: number;
    cfg: number;
    width: number;
    height: number;
}

export async function checkStatus(promptId: string, apiUrl?: string) {
    try {
        const history = await getHistory(promptId, apiUrl);
        if (!history[promptId]) {
            return { status: "pending" };
        }

        const historyItem = history[promptId];
        const outputs = historyItem.outputs;
        const promptData = historyItem.prompt;

        // Extract metadata from the prompt workflow (index 2 in the history array usually contains the inputs)
        // Note: The structure might vary based on ComfyUI version, but typically it is:
        // [queue_id, node_id, workflow_json, ...]
        // Actually, for 'history', the 'prompt' field holds the inputs used.
        // Let's assume promptData[2] is the workflow object.
        let workflow: any = {};
        if (Array.isArray(promptData) && promptData.length > 2) {
            workflow = promptData[2];
        }

        const metadata: ImageMetadata = {
            prompt: "",
            negative_prompt: "",
            seed: 0,
            steps: 0,
            cfg: 0,
            width: 0,
            height: 0
        };

        if (workflow) {
            // Node 3 is KSampler
            if (workflow["3"] && workflow["3"].inputs) {
                metadata.seed = workflow["3"].inputs.seed;
                metadata.steps = workflow["3"].inputs.steps;
                metadata.cfg = workflow["3"].inputs.cfg;
            }
            // Node 6 is Positive Prompt
            if (workflow["6"] && workflow["6"].inputs) {
                metadata.prompt = workflow["6"].inputs.text;
            }
            // Node 7 is Negative Prompt
            if (workflow["7"] && workflow["7"].inputs) {
                metadata.negative_prompt = workflow["7"].inputs.text;
            }
            // Node 5 is Empty Latent
            if (workflow["5"] && workflow["5"].inputs) {
                metadata.width = workflow["5"].inputs.width;
                metadata.height = workflow["5"].inputs.height;
            }
        }

        let images: any[] = [];
        if (outputs["17"] && outputs["17"].images) {
            images = outputs["17"].images;
        }

        if (images.length > 0) {
            const resultImages = images.map(img => ({
                url: getImageUrl(img.filename, img.subfolder, img.type, apiUrl),
                metadata: metadata
            }));
            return { status: "completed", images: resultImages };
        }

        return { status: "processing" };
    } catch (error) {
        return { status: "error", error: String(error) };
    }
}
