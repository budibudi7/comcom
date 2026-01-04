"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Copy, Trash2, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface ImageMetadata {
    prompt: string;
    negative_prompt: string;
    seed: number;
    steps: number;
    cfg: number;
    width: number;
    height: number;
}

export interface GeneratedImage {
    url: string;
    metadata: ImageMetadata;
}

interface GalleryProps {
    images: GeneratedImage[];
    onDelete?: (url: string) => void;
}

export function Gallery({ images, onDelete }: GalleryProps) {
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Reset zoom when image changes
    useEffect(() => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, [selectedImage]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
    const handleResetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
    };

    // Clamp position to keep image partially visible
    const clampPosition = (x: number, y: number) => {
        const maxOffset = 150 * zoom; // Allow some overflow but not too much
        return {
            x: Math.max(-maxOffset, Math.min(maxOffset, x)),
            y: Math.max(-maxOffset, Math.min(maxOffset, y))
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            const newPos = clampPosition(
                e.clientX - dragStart.current.x,
                e.clientY - dragStart.current.y
            );
            setPosition(newPos);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        // Snap back if too far out
        if (zoom <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (zoom > 1 && e.touches.length === 1) {
            setIsDragging(true);
            const touch = e.touches[0];
            dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && zoom > 1 && e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            const newPos = clampPosition(
                touch.clientX - dragStart.current.x,
                touch.clientY - dragStart.current.y
            );
            setPosition(newPos);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (zoom <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleDoubleClick = () => {
        if (zoom === 1) {
            setZoom(2);
        } else {
            handleResetZoom();
        }
    };

    const handleCopyPrompt = () => {
        if (selectedImage) {
            navigator.clipboard.writeText(selectedImage.metadata.prompt);
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000);
        }
    };

    const handleDelete = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        onDelete?.(url);
    };

    if (images.length === 0) return null;

    return (
        <>
            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold">Your Creations</h2>
                    <p className="text-sm text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Gallery Grid - Full width on mobile, grid on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4">
                {images.map((img, idx) => (
                    <motion.div
                        key={img.url + idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative aspect-[3/4] rounded-xl sm:rounded-xl overflow-hidden bg-secondary/50 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all duration-300"
                        onClick={() => setSelectedImage(img)}
                    >
                        <Image
                            src={img.url}
                            alt={`Generated image ${idx + 1}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                        />

                        {/* Hover overlay with delete */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2 flex justify-end">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 bg-black/50 hover:bg-red-500/80 text-white"
                                    onClick={(e) => handleDelete(e, img.url)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Close button - always visible */}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 h-10 w-10 bg-black/50 hover:bg-white/20 text-white rounded-full"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        {/* Zoom controls */}
                        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50 flex gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 bg-black/50 hover:bg-white/20 text-white rounded-full"
                                onClick={handleZoomIn}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 bg-black/50 hover:bg-white/20 text-white rounded-full"
                                onClick={handleZoomOut}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            {zoom !== 1 && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 bg-black/50 hover:bg-white/20 text-white rounded-full"
                                    onClick={handleResetZoom}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            )}
                            <span className="flex items-center px-2 text-xs text-white/70 bg-black/50 rounded-full">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        {/* Layout container */}
                        <div className="h-full flex flex-col lg:flex-row" onClick={(e) => e.stopPropagation()}>
                            {/* Image Container - Full width on mobile */}
                            <motion.div
                                ref={imageContainerRef}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="flex-1 flex items-center justify-center overflow-hidden min-h-0 cursor-grab active:cursor-grabbing touch-none"
                                onWheel={handleWheel}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onDoubleClick={handleDoubleClick}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <img
                                    src={selectedImage.url}
                                    alt="Full size"
                                    className="max-w-full max-h-full object-contain select-none"
                                    style={{
                                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                                    }}
                                    draggable={false}
                                />
                            </motion.div>

                            {/* Metadata Panel - Collapsible bottom sheet on mobile */}
                            <div className="w-full lg:w-[320px] h-auto max-h-[35vh] lg:max-h-full bg-card/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto shrink-0">
                                <div className="p-4 sm:p-5 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-base font-semibold">Details</h3>
                                    </div>

                                    {/* Prompt */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Prompt</span>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm leading-relaxed max-h-[100px] lg:max-h-[150px] overflow-y-auto">
                                            {selectedImage.metadata.prompt}
                                        </div>
                                    </div>

                                    {/* Parameters Grid */}
                                    <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                            <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Steps</div>
                                            <div className="font-mono text-primary text-sm">{selectedImage.metadata.steps}</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                            <div className="text-[10px] text-muted-foreground uppercase mb-0.5">CFG</div>
                                            <div className="font-mono text-primary text-sm">{selectedImage.metadata.cfg}</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                            <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Seed</div>
                                            <div className="font-mono text-primary text-sm truncate">{selectedImage.metadata.seed}</div>
                                        </div>
                                    </div>

                                    {/* Actions - horizontal on mobile */}
                                    <div className="flex gap-2 pt-2 border-t border-white/10">
                                        <Button
                                            className="flex-1 gap-2 h-9 text-sm"
                                            variant="secondary"
                                            onClick={handleCopyPrompt}
                                        >
                                            {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{copiedPrompt ? "Copied!" : "Copy"}</span>
                                        </Button>
                                        <Button
                                            className="flex-1 gap-2 h-9 text-sm"
                                            variant="ghost"
                                            onClick={() => {
                                                onDelete?.(selectedImage.url);
                                                setSelectedImage(null);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
