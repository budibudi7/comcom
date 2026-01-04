"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const aspectPresets = [
    { name: "Portrait", ratio: "2:3", width: 832, height: 1216, icon: "▯" },
    { name: "Landscape", ratio: "3:2", width: 1216, height: 832, icon: "▭" },
    { name: "Square", ratio: "1:1", width: 1024, height: 1024, icon: "□" },
    { name: "Wide", ratio: "16:9", width: 1344, height: 768, icon: "▬" },
];

const stylePresets = [
    { name: "Anime", value: "anime style, detailed, vibrant colors" },
    { name: "Realistic", value: "photorealistic, highly detailed, 8k" },
    { name: "Artistic", value: "oil painting style, artistic, masterpiece" },
    { name: "Fantasy", value: "fantasy art, magical, ethereal lighting" },
];

interface PresetSelectorProps {
    selectedAspect?: { width: number; height: number };
    onAspectChange?: (width: number, height: number) => void;
    onStyleApply?: (stylePrompt: string) => void;
}

export function PresetSelector({ selectedAspect, onAspectChange, onStyleApply }: PresetSelectorProps) {
    const isAspectSelected = (preset: typeof aspectPresets[0]) =>
        selectedAspect?.width === preset.width && selectedAspect?.height === preset.height;

    return (
        <div className="space-y-4">
            {/* Aspect Ratio Presets */}
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {aspectPresets.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => onAspectChange?.(preset.width, preset.height)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                                isAspectSelected(preset)
                                    ? "bg-primary/20 border-primary/50 text-primary"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                            )}
                        >
                            <span className="text-lg">{preset.icon}</span>
                            <span className="font-medium">{preset.ratio}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Style Presets */}
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Style Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {stylePresets.map((preset) => (
                        <Button
                            key={preset.name}
                            variant="ghost"
                            size="sm"
                            onClick={() => onStyleApply?.(preset.value)}
                            className="justify-start text-xs bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                        >
                            {preset.name}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
