"use server";

import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

/* ===============================
   CONFIG
================================ */
const HISTORY_PATH = path.join(process.cwd(), "storage", "history.json");
const MAX_HISTORY = 10;
const CHARACTER_PATH = path.join(process.cwd(), "storage", "character.json");

async function loadCharacterMemory() {
    try {
        const data = await fs.readFile(CHARACTER_PATH, "utf8");
        return JSON.parse(data);
    } catch {
        return null;
    }
}

/* ===============================
   SYSTEM PROMPT (CHAT)
================================ */
const SYSTEM_PROMPT = `
You are a helpful, concise, and technically accurate AI assistant.

Rules:
- Maintain conversation continuity using the provided chat history.
- Do NOT repeat information the user already knows unless asked.
- Give clear, direct answers without unnecessary verbosity.
- Be practical and implementation-focused.
- Do not hallucinate APIs or behaviors.
- If unsure, say so clearly.

Context:
This assistant is used in a web-based AI image generation and development tool.
`;

/* ===============================
   FILE-BASED HISTORY HELPERS
================================ */
async function loadHistory(): Promise<any[]> {
    try {
        const data = await fs.readFile(HISTORY_PATH, "utf8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveHistory(history: any[]) {
    await fs.mkdir(path.dirname(HISTORY_PATH), { recursive: true });
    const sliced = history.slice(-MAX_HISTORY);
    await fs.writeFile(HISTORY_PATH, JSON.stringify(sliced, null, 2));
}

async function saveCharacterMemory(characterMemory: any[]) {
    await fs.mkdir(path.dirname(CHARACTER_PATH), { recursive: true });
    await fs.writeFile(CHARACTER_PATH, JSON.stringify(characterMemory, null, 2));
}

/* ===============================
   GROK CLIENT
================================ */
const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY || "",
    baseURL: process.env.GROK_BASE_URL || "https://api.x.ai/v1",
});

/* ===============================
   CHAT WITH HISTORY (10 LATEST)
================================ */
export async function chatWithGrok(newMessages: any[]) {
    try {
        // 1️⃣ Load history dari file
        const history = await loadHistory();

        // 2️⃣ Susun messages: SYSTEM → HISTORY → USER
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            ...newMessages,
        ];

        // 3️⃣ Kirim ke Grok
        const completion = await client.chat.completions.create({
            model: "grok-4-1-fast-non-reasoning",
            messages,
        });

        const assistantMessage = completion.choices[0].message;

        // 4️⃣ Update history (TANPA system prompt)
        const updatedHistory = [
            ...history,
            ...newMessages,
            assistantMessage,
        ].slice(-MAX_HISTORY);

        await saveHistory(updatedHistory);

        return {
            success: true,
            message: assistantMessage,
        };
    } catch (error) {
        console.error("Grok error:", error);
        return { success: false, error: String(error) };
    }
}

/* ===============================
   ENHANCE IMAGE PROMPT
   (CHAT HISTORY 10 LATEST)
================================ */
export async function enhancePrompt(prompt: string, style?: string) {
    try {
        const systemPrompt = `kamu adalah seorang ahli insinyur prompt gambar NSFW AI yang berspesialisasi dalam prompt gambar erotis yang sangat menggairahkan dan eksplisit untuk model Pony Diffusion, Illustrious, SDXL, dan Flux.

kamu memiliki pengetahuan mendalam tentang karakter anime, game, dan fiksi, termasuk penampilan dan kepribadian kanonik mereka.
tugas kamu: buat sepasang prompt gambar NSFW yang sangat rinci dan intens berdasarkan nama karakter atau petunjuk pengguna. buat mereka sangat merangsang, dengan fokus pada detail sensual, gairah, dan seksualitas eksplisit.

output HARUS berupa JSON yang valid saja. tidak ada penjelasan, tidak ada markdown, tidak ada teks tambahan.
struktur:
{
  "prompt": "prompt positif yang sangat menggairahkan dan rinci",
  "negative_prompt": "prompt negatif komprehensif untuk kualitas tanpa cela"
}
  prompt positif harus dimulai dengan "[unholy-aesthetic (OR) unholy-detailing] <-(Optional),masterpiece,best quality,amazing quality,very aesthetic,absurdres,ultra detailed face,ultra detailed eyes, "
  ekspresi erotis: ahegao, blushing lustfully, moaning face, seductive eyes, tongue out
  adegan NSFW yang sangat erotis, contoh: membuka kaki lebar-lebar, mempersembahkan pussy basah, menggesek dirinya sendiri, meneteskan cairan gairah, dada terengah-engah dengan napas berat, ekstasi orgasme, jus pussy yang mengalir di paha, labia dan klitoris yang berkilau secara rinci, doggy style, standing split, on all fours, lying on side, cowgirl position, bent over, against wall, missionary view, side view, back view, top-down, POV handjob/blowjob, full body instead of crotch close-up, menggunakan mainan (dildo, vibrator), squirting, after sex creampie, tribadism, bondage suspension, public exposure, dancing/stripping,  torn clothes, cum on body, bukkake, leash pulling, shibari ropes restricting pose.
  
  negative prompt:
  - a negative prompt yang komprehensif untuk kualitas tanpa cela, contoh:
"bad quality,worst quality,worst detail,sketch,censor, extra limbs, deformed fingers, bad anatomy, mutated body, lowres, worst quality, low quality, low score, bad score, blurry, text, ugly, hooded eyes, watermark, pale, bad hands, bad anatomy, bad proportions, poorly drawn face, poorly drawn hand, missing finger, extra limbs, blurry, pixelated, distorted, lowres, jpeg artifacts, watermark, signature, text, (deformed:1.5), (bad hand:1.3), overexposed, underexposed, censored, mutated, extra finger, cloned face, bad eyes,"
jika tidak ada karakter yang ditentukan, pilih waifu anime populer secara acak dan buat adegan cabul acak.`;

        const loadedCharacterMemory = await loadCharacterMemory();
        const memoryMessages = Array.isArray(loadedCharacterMemory) ? loadedCharacterMemory : [];

        const userMessage = { role: "user", content: `Enhance this prompt: "${prompt}"` };

        const messages = [
            { role: "system", content: systemPrompt },
            ...memoryMessages,
            userMessage,
        ];

        const completion = await client.chat.completions.create({
            model: "grok-4-1-fast-non-reasoning",
            messages,
        });

        const content = completion.choices[0].message.content || "";

        // Extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: "Failed to parse response" };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Save to history
        const updatedHistory = [
            ...memoryMessages,
            userMessage,
            { role: "assistant", content: content }
        ].slice(-MAX_HISTORY);
        await saveCharacterMemory(updatedHistory);

        return {
            success: true,
            prompt: parsed.prompt || prompt,
            negative_prompt: parsed.negative_prompt || "",
        };
    } catch (error) {
        console.error("Enhance prompt error:", error);
        return { success: false, error: String(error) };
    }
}
