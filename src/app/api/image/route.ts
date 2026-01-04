import { NextRequest, NextResponse } from "next/server";
import { getFileStream } from "@/lib/googleDrive";
import { Readable } from "stream";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
        return new NextResponse("Missing file ID", { status: 400 });
    }

    try {
        const stream = await getFileStream(id);

        // Convert Node stream to Web stream
        // @ts-ignore
        const webStream = Readable.toWeb(stream);

        return new NextResponse(webStream as any, {
            headers: {
                "Content-Type": "image/webp",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Failed to fetch image", { status: 500 });
    }
}
