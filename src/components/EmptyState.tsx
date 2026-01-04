"use client";

import { Sparkles, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const examplePrompts = [
    "A mystical forest with glowing mushrooms and fireflies at twilight",
    "Cyberpunk cityscape with neon lights reflecting on wet streets",
    "Elegant anime girl in a flowing white dress among cherry blossoms",
    "Majestic dragon soaring through storm clouds at sunset",
];

interface EmptyStateProps {
    onPromptSelect?: (prompt: string) => void;
}

export function EmptyState({ onPromptSelect }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[400px] px-6"
        >
            {/* Icon */}
            <motion.div
                className="relative mb-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <ImageIcon className="w-12 h-12 text-primary/60" />
                </div>
                <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ rotate: [0, 15, 0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
            </motion.div>

            {/* Text */}
            <h3 className="text-xl font-semibold text-foreground mb-2">
                No images yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
                Start creating stunning AI-generated artwork. Enter a prompt and watch the magic happen.
            </p>

            {/* Example Prompts */}
            <div className="w-full max-w-lg space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold text-center mb-4">
                    Try these prompts
                </p>
                <div className="grid gap-2">
                    {examplePrompts.map((prompt, idx) => (
                        <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => onPromptSelect?.(prompt)}
                            className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-sm text-foreground/80 hover:text-foreground group"
                        >
                            <span className="line-clamp-1">{prompt}</span>
                            <Sparkles className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
