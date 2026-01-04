import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
        return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "storage", "output", safeFilename);

    try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(safeFilename).toLowerCase().replace(".", "");
        const mimeType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/webp";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Local file read error:", error);
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
