"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Generator } from "@/components/Generator";
import { Gallery, GeneratedImage } from "@/components/Gallery";
import { ChatAssistant } from "@/components/ChatAssistant";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { Images, Sparkles } from "lucide-react";

type PendingPrompt = { promptId: string; apiIndex: number };

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingPrompts, setPendingPrompts] = useState<PendingPrompt[]>([]);
  const [uploadingPrompts, setUploadingPrompts] = useState<PendingPrompt[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [previewImages, setPreviewImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "gallery">("create");
  const [promptFromEmptyState, setPromptFromEmptyState] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPolling = useRef(false);
  const isLoaded = useRef(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("auragen-history");
    if (saved) {
      try {
        setImages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    isLoaded.current = true;
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem("auragen-history", JSON.stringify(images));
    }
  }, [images]);

  const checkStatus = async (promptId: string, apiIndex: number, action: "poll" | "retrieve" = "poll") => {
    const params = new URLSearchParams();
    params.set("promptId", promptId);
    params.set("apiIndex", apiIndex.toString());
    params.set("action", action);

    // Use relative URL for client-side fetch matches current origin
    const res = await fetch(`/api/status?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Status check failed");
    return data;
  };

  const finalizeUpload = async (p: PendingPrompt) => {
    try {
      const res = await checkStatus(p.promptId, p.apiIndex, "retrieve");
      if (res.status === "completed" && res.images) {
        const incoming = res.images as unknown as GeneratedImage[];

        setPreviewImages(prev => {
          const filtered = incoming.filter(img => !prev.some(p => p.url === img.url));
          return [...prev, ...filtered];
        });

        // Add to main history immediately for persistence
        setImages(prev => {
          const filtered = incoming.filter(img => !prev.some(p => p.url === img.url));
          return [...filtered, ...prev];
        });

        setUploadingPrompts(prev => prev.filter(item => item.promptId !== p.promptId));
      }
    } catch (e) {
      console.error("Upload failed", e);
      setUploadingPrompts(prev => prev.filter(item => item.promptId !== p.promptId));
    }
  };

  // Manage isGenerating state based on pending prompts
  useEffect(() => {
    if (pendingPrompts.length === 0) {
      setIsGenerating(false);
    }
  }, [pendingPrompts]);

  // Polling for generation status - polls all pending prompts independently
  useEffect(() => {
    if (pendingPrompts.length > 0) {
      const poll = async () => {
        if (isPolling.current) return;
        isPolling.current = true;

        try {
          // Trigger checks for all prompts, but handle results individually
          await Promise.all(
            pendingPrompts.map(async (p) => {
              try {
                const status = await checkStatus(p.promptId, p.apiIndex, "poll");

                if (status.status === "ready") {
                  // Update state immediately
                  setUploadingPrompts(prev => {
                    if (prev.some(item => item.promptId === p.promptId)) return prev;
                    return [...prev, p];
                  });

                  setPendingPrompts(prev => prev.filter(item => item.promptId !== p.promptId));
                  finalizeUpload(p); // Start upload
                } else if (status.status === "error") {
                  console.error("Generation error:", status.error);
                  // Remove erroneous prompt so we don't block
                  setPendingPrompts(prev => prev.filter(item => item.promptId !== p.promptId));
                }
              } catch (error) {
                console.error("Poll error for " + p.promptId, error);
              }
            })
          );
        } finally {
          isPolling.current = false;
        }
      };

      timerRef.current = setInterval(poll, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pendingPrompts]);

  const handleDeleteImage = useCallback((url: string) => {
    setImages(prev => prev.filter(img => img.url !== url));
  }, []);

  const handleGenerateStart = useCallback(() => {
    // Clear preview images as they are already in history
    if (previewImages.length > 0) {
      setPreviewImages([]);
    }
    setIsGenerating(true);
  }, [previewImages]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <Navbar
        isGenerating={isGenerating}
        onMenuToggle={() => setActiveTab(activeTab === "create" ? "gallery" : "create")}
        isSidebarOpen={activeTab === "gallery"}
      />

      {/* Main Layout */}
      <div className="flex-1 pt-16">
        {/* Desktop: Side by side layout */}
        <div className="hidden lg:flex h-[calc(100vh-4rem)]">
          {/* Sidebar - Generator always visible on desktop */}
          <aside className="w-80 xl:w-96 h-full bg-card/50 backdrop-blur-xl border-r border-white/5 overflow-y-auto shrink-0">
            <div className="p-4">
              <Generator
                isGenerating={isGenerating}
                onGenerateStart={handleGenerateStart}
                onGenerateSuccess={(prompts) => setPendingPrompts(prompts)}
                initialPrompt={promptFromEmptyState}
              />
            </div>
          </aside>

          {/* Main Content - Desktop */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              {/* Unified Preview & Loading Grid - Desktop */}
              {(isGenerating || uploadingPrompts.length > 0 || previewImages.length > 0) && (
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {isGenerating ? "Generating..." : "Just generated"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Render completed preview images */}
                    {previewImages.map((img, i) => (
                      <motion.div
                        key={img.url}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5"
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </motion.div>
                    ))}

                    {/* Render loading placeholders for uploading */}
                    {uploadingPrompts.map((p, i) => (
                      <motion.div
                        key={`upload-${p.promptId}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-[3/4] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Render loading placeholders for pending prompts */}
                    {pendingPrompts.map((p, i) => (
                      <motion.div
                        key={p.promptId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (previewImages.length + i) * 0.1 }}
                        className="aspect-[3/4] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden"
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center scale-75">
                          <ProgressIndicator isGenerating={true} />
                        </div>
                      </motion.div>
                    ))}

                    {/* Initial Loading State (when pendingPrompts is empty but isGenerating is true) */}
                    {isGenerating && pendingPrompts.length === 0 && previewImages.length === 0 && (
                      Array.from({ length: 2 }).map((_, i) => (
                        <motion.div
                          key={`skeleton-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="aspect-[3/4] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center scale-75">
                            <ProgressIndicator isGenerating={true} />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {!isGenerating && previewImages.length === 0 && images.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                  <Images className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No images yet</h3>
                  <p className="text-sm text-muted-foreground/70">Generate your first image using the panel on the left</p>
                </div>
              )}
              {!isGenerating && images.length > 0 && (
                <Gallery images={images} onDelete={handleDeleteImage} />
              )}
            </div>
          </main>
        </div>

        {/* Mobile: Tab-based layout - Generator is Home */}
        <div className="lg:hidden flex flex-col h-[calc(100vh-4rem)]">
          {/* Mobile Content */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === "create" && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 space-y-6"
                >
                  <Generator
                    isGenerating={isGenerating}
                    onGenerateStart={handleGenerateStart}
                    onGenerateSuccess={(prompts) => setPendingPrompts(prompts)}
                    initialPrompt={promptFromEmptyState}
                  />
                  {/* Unified Preview & Loading Grid - Mobile */}
                  {(isGenerating || previewImages.length > 0) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {isGenerating ? "Generating..." : "Just generated"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Completed images */}
                        {previewImages.map((img, i) => (
                          <motion.div
                            key={img.url}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5"
                          >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </motion.div>
                        ))}

                        {/* Uploading placeholders */}
                        {uploadingPrompts.map((p, i) => (
                          <motion.div
                            key={`upload-mobile-${p.promptId}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-[3/4] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden"
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {/* Loading placeholders */}
                        {pendingPrompts.map((p, i) => (
                          <motion.div
                            key={p.promptId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (previewImages.length + i) * 0.1 }}
                            className="aspect-[3/4] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden"
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center scale-75">
                              <ProgressIndicator isGenerating={true} />
                            </div>
                          </motion.div>
                        ))}

                        {/* Initial Loading State */}
                        {isGenerating && pendingPrompts.length === 0 && previewImages.length === 0 && (
                          Array.from({ length: 2 }).map((_, i) => (
                            <motion.div
                              key={`skeleton-mobile-${i}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="aspect-[3/4] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden"
                            >
                              <div className="absolute inset-0 flex flex-col items-center justify-center scale-75">
                                <ProgressIndicator isGenerating={true} />
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === "gallery" && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4"
                >
                  {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                      <Images className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">No images yet</h3>
                      <p className="text-sm text-muted-foreground/70 mb-4">Generate your first image</p>
                      <button
                        onClick={() => setActiveTab("create")}
                        className="text-primary hover:underline text-sm"
                      >
                        Go to Create →
                      </button>
                    </div>
                  ) : (
                    <Gallery images={images} onDelete={handleDeleteImage} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Tab Bar */}
          <nav className="shrink-0 border-t border-white/10 bg-card/95 backdrop-blur-xl safe-area-pb">
            <div className="flex">
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeTab === "create"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-medium">Create</span>
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${activeTab === "gallery"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Images className="w-5 h-5" />
                <span className="text-xs font-medium">Gallery</span>
                {images.length > 0 && (
                  <span className="absolute top-2 right-1/4 w-5 h-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white">
                    {images.length > 99 ? "99+" : images.length}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}
