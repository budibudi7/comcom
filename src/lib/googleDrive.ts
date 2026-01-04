import fs from "fs";
import { google } from "googleapis";
import { Readable } from "stream";

const TOKEN_PATH = "token.json";
const OAUTH_PATH = "oauth.json";
const FOLDER_ID = "1n6x_vt3fBGkqkM0vTaGRx6B7gda_GEwk";

function getAuth() {
    const credentials = JSON.parse(
        fs.readFileSync(OAUTH_PATH, "utf8")
    ) as {
        installed: {
            client_id: string;
            client_secret: string;
            redirect_uris: string[];
        };
    };

    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));

    const auth = new google.auth.OAuth2(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        credentials.installed.redirect_uris[0]
    );

    auth.setCredentials(token);
    return auth;
}

export async function uploadImageToDrive(
    buffer: Buffer,
    filename = `image-${Date.now()}.webp`
): Promise<string> {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    // Check if file already exists
    try {
        const existing = await drive.files.list({
            q: `name = '${filename}' and '${FOLDER_ID}' in parents and trashed = false`,
            fields: "files(id, name)",
        });

        if (existing.data.files && existing.data.files.length > 0) {
            console.log(`File ${filename} already exists, returning existing ID`);
            const existingId = existing.data.files[0].id!;
            return `/api/image?id=${existingId}`;
        }
    } catch (e) {
        console.warn("Failed to check existing file:", e);
    }

    const stream = Readable.from(buffer);

    const file = await drive.files.create({
        requestBody: {
            name: filename,
            parents: [FOLDER_ID],
        },
        media: {
            mimeType: "image/webp",
            body: stream,
        },
        fields: "id",
    });

    const fileId = file.data.id!;

    // We don't need to make it public since we are proxying
    // await drive.permissions.create(...) 

    return `/api/image?id=${fileId}`;
}

export async function getFileStream(fileId: string) {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    try {
        const response = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "stream" }
        );
        return response.data;
    } catch (error) {
        console.error("Error getting file stream from Drive:", error);
        throw error;
    }
}
