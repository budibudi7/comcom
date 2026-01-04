export type GenerationParams = {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg?: number;
    seed?: number;
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
