"use client";

import { Sparkles, History, Settings, HelpCircle, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface NavbarProps {
    isGenerating?: boolean;
    onMenuToggle?: () => void;
    isSidebarOpen?: boolean;
}

export function Navbar({ isGenerating, onMenuToggle, isSidebarOpen }: NavbarProps) {
    const { data: session } = useSession();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

                    <Link href="/dashboard">
                        <motion.div
                            className="flex items-center gap-2 cursor-pointer"
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
                    </Link>
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

                    {/* User Menu */}
                    <div className="relative ml-2">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-white/20 transition-all"
                        >
                            {session?.user?.email?.[0].toUpperCase() || "U"}
                        </button>

                        <AnimatePresence>
                            {isUserMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden"
                                >
                                    <div className="p-4 border-b border-white/5">
                                        <p className="text-xs text-muted-foreground font-medium">Signed in as</p>
                                        <p className="text-sm font-bold text-white truncate" title={session?.user?.email || ""}>
                                            {session?.user?.email || "Guest"}
                                        </p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Log Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            {/* Click outside to close */}
            {isUserMenuOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsUserMenuOpen(false)}
                />
            )}
        </nav>
    );
}
