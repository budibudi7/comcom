"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PresetSelector } from "@/components/PresetSelector";
import { enhancePrompt } from "@/app/actions";
import { GenerationParams } from "@/lib/types";
import { Loader2, Sparkles, ChevronDown, ChevronUp, Shuffle, Wand2, Dices } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import characters from "@/data/char.json";


interface GeneratorProps {
    onGenerateStart: () => void;
    onGenerateSuccess: (prompts: Array<{ promptId: string; apiIndex: number }>) => void;
    isGenerating: boolean;
    initialPrompt?: string;
}

export function Generator({ onGenerateStart, onGenerateSuccess, isGenerating, initialPrompt }: GeneratorProps) {
    const [params, setParams] = useState<GenerationParams>({
        prompt: "",
        negative_prompt: "low quality, bad anatomy, worst quality, watermark, text, blurry",
        width: 832,
        height: 1216,
        steps: 20,
        cfg: 2.5,
        seed: undefined
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    // Handle initial prompt from EmptyState
    useEffect(() => {
        if (initialPrompt) {
            setParams(prev => ({ ...prev, prompt: initialPrompt }));
        }
    }, [initialPrompt]);

    const generateImage = async (params: GenerationParams) => {
        const res = await fetch("/api/generate", {
            method: "POST",
            body: JSON.stringify(params),
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        return data;
    };

    const handleGenerate = async () => {
        if (!params.prompt) return;
        onGenerateStart();
        const res = await generateImage(params);
        if (res.success && res.prompts && res.prompts.length > 0) {
            onGenerateSuccess(res.prompts);
        } else {
            console.error("Failed to generate", res.error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleGenerate();
        }
    };

    const randomizeSeed = () => {
        setParams({ ...params, seed: Math.floor(Math.random() * 1000000000) });
    };

    const handleAspectChange = (width: number, height: number) => {
        setParams({ ...params, width, height });
    };

    const handleStyleApply = (stylePrompt: string) => {
        const currentPrompt = params.prompt.trim();
        if (currentPrompt && !currentPrompt.includes(stylePrompt)) {
            setParams({ ...params, prompt: `${currentPrompt}, ${stylePrompt}` });
        } else if (!currentPrompt) {
            setParams({ ...params, prompt: stylePrompt });
        }
    };

    const handleEnhance = async () => {
        if (!params.prompt.trim() || isEnhancing) return;
        setIsEnhancing(true);
        try {
            const result = await enhancePrompt(params.prompt);
            if (result.success && result.prompt) {
                setParams(prev => ({
                    ...prev,
                    prompt: result.prompt,
                    negative_prompt: result.negative_prompt || prev.negative_prompt
                }));
            }
        } catch (error) {
            console.error("Enhance error:", error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleRandomChar = () => {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        // Replace [nameChar] placeholder or add to prompt
        const currentPrompt = params.prompt;
        if (currentPrompt.includes("[nameChar]")) {
            setParams({ ...params, prompt: currentPrompt.replace("[nameChar]", randomChar) });
        } else {
            // Replace any existing character pattern (starts with "1girl," or "1boy," etc)
            const charPattern = /^(1girl|1boy|1other),\s*[^,]+,\s*[^,]+/;
            if (charPattern.test(currentPrompt)) {
                setParams({ ...params, prompt: currentPrompt.replace(charPattern, randomChar) });
            } else {
                // Prepend character to prompt
                setParams({ ...params, prompt: randomChar + (currentPrompt ? ", " + currentPrompt : "") });
            }
        }
    };

    return (
        <div className="space-y-6" onKeyDown={handleKeyDown}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Create
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Describe what you want to generate
                    </p>
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={handleRandomChar}
                    title="Random Character"
                >
                    <Dices className="w-5 h-5" />
                </Button>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-xs text-muted-foreground uppercase tracking-wider">
                        Prompt
                    </Label>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs gap-1 text-primary hover:text-primary/80"
                        onClick={handleEnhance}
                        disabled={isEnhancing || !params.prompt.trim()}
                    >
                        {isEnhancing ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Enhancing...</>
                        ) : (
                            <><Wand2 className="w-3 h-3" /> Enhance</>
                        )}
                    </Button>
                </div>
                <textarea
                    id="prompt"
                    className="flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none transition-all"
                    placeholder="A magical forest with glowing bioluminescent plants..."
                    value={params.prompt}
                    onChange={(e) => setParams({ ...params, prompt: e.target.value })}
                />
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Enter</kbd> to generate
                    </p>
                    {params.prompt.trim() && (
                        <button
                            type="button"
                            className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors"
                            onClick={() => setParams({ ...params, prompt: "" })}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Preset Selector */}
            <PresetSelector
                selectedAspect={{ width: params.width!, height: params.height! }}
                onAspectChange={handleAspectChange}
                onStyleApply={handleStyleApply}
            />

            {/* Advanced Settings Toggle */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <span>Advanced Settings</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Advanced Settings */}
            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        {/* Negative Prompt */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                Negative Prompt
                            </Label>
                            <Input
                                value={params.negative_prompt}
                                onChange={(e) => setParams({ ...params, negative_prompt: e.target.value })}
                                className="bg-white/5 border-white/10"
                                placeholder="Things to avoid..."
                            />
                        </div>

                        {/* Steps & CFG */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex justify-between">
                                    <span>Steps</span>
                                    <span className="text-primary font-mono">{params.steps}</span>
                                </Label>
                                <Slider
                                    min={10} max={50} step={1}
                                    value={[params.steps!]}
                                    onValueChange={([val]) => setParams({ ...params, steps: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex justify-between">
                                    <span>CFG Scale</span>
                                    <span className="text-primary font-mono">{params.cfg}</span>
                                </Label>
                                <Slider
                                    min={1} max={20} step={0.5}
                                    value={[params.cfg!]}
                                    onValueChange={([val]) => setParams({ ...params, cfg: val })}
                                />
                            </div>
                        </div>

                        {/* Dimensions */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex justify-between">
                                    <span>Width</span>
                                    <span className="text-primary font-mono">{params.width}px</span>
                                </Label>
                                <Slider
                                    min={512} max={1536} step={64}
                                    value={[params.width!]}
                                    onValueChange={([val]) => setParams({ ...params, width: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex justify-between">
                                    <span>Height</span>
                                    <span className="text-primary font-mono">{params.height}px</span>
                                </Label>
                                <Slider
                                    min={512} max={1536} step={64}
                                    value={[params.height!]}
                                    onValueChange={([val]) => setParams({ ...params, height: val })}
                                />
                            </div>
                        </div>

                        {/* Seed */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                Seed
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Random"
                                    value={params.seed || ""}
                                    onChange={(e) => setParams({ ...params, seed: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="bg-white/5 border-white/10 flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={randomizeSeed}
                                    className="border border-white/10 hover:bg-white/10"
                                >
                                    <Shuffle className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generate Button */}
            <Button
                className="w-full h-12 font-semibold text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                variant="premium"
                onClick={handleGenerate}
                disabled={isGenerating || !params.prompt}
            >
                {isGenerating ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                ) : (
                    <><Sparkles className="mr-2 h-5 w-5" /> Generate</>
                )}
            </Button>
        </div>
    );
}
