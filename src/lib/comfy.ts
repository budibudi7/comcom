// Parse comma-separated API URLs from env
const apiUrlsEnv = process.env.COMFY_API_URL || "https://ngopi.com";
export const COMFY_API_URLS = apiUrlsEnv.split(",").map(url => url.trim());
export const COMFY_API_URL = COMFY_API_URLS[0]; // Default for backwards compatibility

export interface ComfyNode {
    inputs: Record<string, any>;
    class_type: string;
    _meta?: {
        title?: string;
    };
}

export interface ComfyWorkflow {
    [key: string]: ComfyNode;
}

export interface PromptResponse {
    prompt_id: string;
    number: number;
    node_errors: any;
}

export interface HistoryResponse {
    [prompt_id: string]: {
        prompt: [number, string, any, any, any];
        outputs: {
            [node_id: string]: {
                images: Array<{
                    filename: string;
                    subfolder: string;
                    type: string;
                }>;
            };
        };
        status: {
            status_str: string;
            completed: boolean;
            messages: any[][];
        };
    };
}

export async function queuePrompt(workflow: ComfyWorkflow, apiUrl: string = COMFY_API_URL): Promise<PromptResponse> {
    const res = await fetch(`${apiUrl}/prompt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: workflow }),
    });

    if (!res.ok) {
        throw new Error(`Failed to queue prompt: ${res.statusText}`);
    }

    return res.json();
}

export async function getHistory(promptId: string, apiUrl: string = COMFY_API_URL): Promise<HistoryResponse> {
    const res = await fetch(`${apiUrl}/history/${promptId}`, {
        method: "GET",
    });

    if (!res.ok) {
        throw new Error(`Failed to get history: ${res.statusText}`);
    }

    return res.json();
}

export function getImageUrl(filename: string, subfolder: string = "", type: string = "output", apiUrl: string = COMFY_API_URL) {
    const params = new URLSearchParams({
        filename,
        subfolder,
        type,
    });
    return `${apiUrl}/view?${params.toString()}`;
}
