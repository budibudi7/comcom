"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Copy, Check } from "lucide-react";
import { chatWithGrok } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type Message = {
    role: "user" | "assistant";
    content: string;
};

function CodeBlock({ node, inline, className, children, ...props }: any) {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const language = match ? match[1] : 'text';

    if (!inline) {
        return (
            <div className="relative group my-2 rounded-md overflow-hidden border border-white/10">
                <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6"
                        onClick={handleCopy}
                        title="Copy code"
                    >
                        {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="!m-0 !rounded-none !bg-[#1e1e1e]"
                    {...props}
                >
                    {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
            </div>
        );
    }

    return (
        <code className={cn("bg-muted px-1.5 py-0.5 rounded-sm font-mono text-sm", className)} {...props}>
            {children}
        </code>
    );
}

export function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        const apiMessages = [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
        }));

        const response = await chatWithGrok(apiMessages);

        setIsLoading(false);

        if (response.success && response.message) {
            setMessages((prev) => [...prev, { role: "assistant", content: response.message.content || "" }]);
        } else {
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-36 lg:bottom-20 right-4 z-50 w-[calc(100%-2rem)] sm:w-[350px] md:w-[450px] h-[60vh] lg:h-[600px] bg-card border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden glass-panel"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/10">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-foreground">Grok Assistant</h3>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground mt-20">
                                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>How can I help you today?</p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] rounded-lg px-4 py-3 text-sm overflow-hidden",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-secondary text-secondary-foreground"
                                        )}
                                    >
                                        {msg.role === 'user' ? (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code: CodeBlock
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-background/50">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Grok..."
                                    className="bg-secondary/50"
                                />
                                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                className="fixed bottom-20 lg:bottom-4 right-4 z-50 p-4 rounded-full bg-primary text-white shadow-lg hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <MessageCircle className="w-6 h-6" />
            </motion.button>
        </>
    );
}
