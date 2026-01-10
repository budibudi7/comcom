"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, UserPlus } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
        >
            {pending ? "Creating account..." : "Create Account"}
            {!pending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </button>
    );
}

export default function SignupPage() {
    const [state, dispatch] = useActionState(signup, undefined);

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center gap-2 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-2 shadow-lg shadow-green-500/20">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                            Join AuraGen
                        </h1>
                        <p className="text-zinc-400 text-sm">Start creating AI art today</p>
                    </div>

                    <form action={dispatch} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 ml-1">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-black/20 rounded-xl border border-white/10 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder:text-zinc-600 text-white"
                                placeholder="you@example.com"
                            />
                            {state?.errors?.email && (
                                <p className="text-red-400 text-xs ml-1 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-400" />
                                    {state.errors.email[0]}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300 ml-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-black/20 rounded-xl border border-white/10 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 outline-none transition-all placeholder:text-zinc-600 text-white"
                                placeholder="••••••••"
                            />
                            {state?.errors?.password && (
                                <p className="text-red-400 text-xs ml-1 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-red-400" />
                                    {state.errors.password[0]}
                                </p>
                            )}
                        </div>

                        {state?.message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className={`p-3 border rounded-xl text-sm flex items-center gap-2 ${state.message === "Account created successfully!"
                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${state.message === "Account created successfully!" ? "bg-green-400" : "bg-red-400"}`} />
                                {state.message}
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-400">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-all">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
