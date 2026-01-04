"use client";

import { motion } from "framer-motion";

interface ProgressIndicatorProps {
    isGenerating: boolean;
    progress?: number; // 0-100, optional
}

export function ProgressIndicator({ isGenerating, progress }: ProgressIndicatorProps) {
    if (!isGenerating) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center justify-center p-8 gap-6"
        >
            {/* Animated Ring */}
            <div className="relative w-32 h-32">
                {/* Background ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-white/10"
                    />
                </svg>

                {/* Animated progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={283}
                        initial={{ strokeDashoffset: 283 }}
                        animate={{
                            strokeDashoffset: progress !== undefined
                                ? 283 - (283 * progress / 100)
                                : [283, 70, 283]
                        }}
                        transition={progress !== undefined
                            ? { duration: 0.3 }
                            : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#667eea" />
                            <stop offset="50%" stopColor="#764ba2" />
                            <stop offset="100%" stopColor="#f093fb" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        className="w-3 h-3 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
                <motion.p
                    className="text-lg font-medium text-foreground"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    Creating your masterpiece...
                </motion.p>
                <p className="text-sm text-muted-foreground">
                    This usually takes 10-30 seconds
                </p>
            </div>

            {/* Animated dots */}
            <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}
