import { NextResponse } from "next/server";
import { getHistory, getImageUrl, COMFY_API_URLS } from "@/lib/comfy";
import { uploadImageToDrive } from "@/lib/googleDrive";
import { promises as fs } from "fs";
import path from "path";

interface ImageMetadata {
    prompt: string;
    negative_prompt: string;
    seed: number;
    steps: number;
    cfg: number;
    width: number;
    height: number;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get("promptId");
    const apiIndex = searchParams.get("apiIndex");
    const action = searchParams.get("action"); // "poll" or "retrieve"

    if (!promptId) {
        return NextResponse.json({ status: "error", error: "Missing promptId" }, { status: 400 });
    }

    const targetApiUrl = apiIndex ? COMFY_API_URLS[parseInt(apiIndex)] : COMFY_API_URLS[0];

    try {
        const history = await getHistory(promptId, targetApiUrl);
        if (!history[promptId]) {
            return NextResponse.json({ status: "pending" });
        }

        const historyItem = history[promptId];
        const outputs = historyItem.outputs;
        const promptData = historyItem.prompt;

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
            // Poll Mode: Just return that it is ready, don't upload yet
            if (action !== "retrieve") {
                return NextResponse.json({
                    status: "ready",
                    images: images.map(img => ({
                        // Return raw info for retrieval later
                        filename: img.filename,
                        subfolder: img.subfolder,
                        type: img.type,
                        metadata: metadata
                    }))
                });
            }

            // Retrieve Mode: Save local & background upload
            const resultImages = await Promise.all(images.map(async img => {
                const originalUrl = getImageUrl(img.filename, img.subfolder, img.type, targetApiUrl);

                try {
                    // Fetch image from ComfyUI
                    const res = await fetch(originalUrl);
                    if (!res.ok) throw new Error("Failed to fetch image from Comfy");

                    const arrayBuffer = await res.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const uniqueFilename = `${promptId}_${img.filename}`;

                    // 1. Save locally to storage/output
                    const outputDir = path.join(process.cwd(), "storage", "output");
                    const outputPath = path.join(outputDir, uniqueFilename);

                    // Add error handling for directory existence just in case
                    try {
                        await fs.mkdir(outputDir, { recursive: true });
                        await fs.writeFile(outputPath, buffer);
                    } catch (fsError) {
                        console.error("Local save failed", fsError);
                        // Fallback? If local save fails, maybe just return original URL or try Drive wait?
                        // But usually filesystem works. checking upload.
                    }

                    const localUrl = `/api/local-image?filename=${uniqueFilename}`;

                    // 2. Upload into Drive (Background - Fire and Forget)
                    uploadImageToDrive(buffer, uniqueFilename)
                        .then(driveUrl => {
                            console.log(`Background upload success: ${uniqueFilename} -> ${driveUrl}`);
                        })
                        .catch(e => {
                            console.error(`Background upload failed: ${uniqueFilename}`, e);
                        });

                    // 3. Return local URL immediately
                    return {
                        url: localUrl,
                        metadata: metadata
                    };
                } catch (e) {
                    console.error("Failed retrieval sequence", e);
                    // Fallback to original URL if everything fails
                    return {
                        url: originalUrl,
                        metadata: metadata
                    };
                }
            }));

            return NextResponse.json({ status: "completed", images: resultImages });
        }

        return NextResponse.json({ status: "processing" });
    } catch (error) {
        return NextResponse.json({ status: "error", error: String(error) }, { status: 500 });
    }
}
