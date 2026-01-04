"use server";

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
