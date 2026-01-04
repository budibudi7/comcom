"use client";

import { Sparkles, History, Settings, HelpCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

interface NavbarProps {
    isGenerating?: boolean;
    onMenuToggle?: () => void;
    isSidebarOpen?: boolean;
}

export function Navbar({ isGenerating, onMenuToggle, isSidebarOpen }: NavbarProps) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-background/80 backdrop-blur-xl border-b border-white/5">
            <div className="h-full px-4 flex items-center justify-between">
                {/* Left: Logo & Menu */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={onMenuToggle}
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>

                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="relative">
                            <Sparkles className="w-7 h-7 text-primary" />
                            {isGenerating && (
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-primary/30"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                                AuraGen
                            </span>
                        </span>
                        <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                            STUDIO
                        </span>
                    </motion.div>
                </div>

                {/* Center: Status */}
                <div className="hidden md:flex items-center gap-2">
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                        >
                            <motion.div
                                className="w-2 h-2 rounded-full bg-primary"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                            />
                            <span className="text-xs text-primary font-medium">Generating...</span>
                        </motion.div>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                        <History className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <HelpCircle className="w-4 h-4" />
                    </Button>

                    {/* User Avatar Placeholder */}
                    <div className="ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        U
                    </div>
                </div>
            </div>
        </nav>
    );
}
