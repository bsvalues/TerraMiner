"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ImageIcon,
} from "lucide-react";

interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  type?: "exterior" | "interior" | "aerial" | "street" | "other";
}

interface PropertyImageGalleryProps {
  propertyId: string;
  images?: PropertyImage[];
  className?: string;
}

// Mock images for demo
const generateMockImages = (propertyId: string): PropertyImage[] => {
  const seed = propertyId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return [
    {
      id: `${propertyId}-1`,
      url: `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80&seed=${seed}`,
      caption: "Front exterior view",
      type: "exterior",
    },
    {
      id: `${propertyId}-2`,
      url: `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&seed=${seed + 1}`,
      caption: "Side view with landscaping",
      type: "exterior",
    },
    {
      id: `${propertyId}-3`,
      url: `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&seed=${seed + 2}`,
      caption: "Living room interior",
      type: "interior",
    },
    {
      id: `${propertyId}-4`,
      url: `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&seed=${seed + 3}`,
      caption: "Kitchen area",
      type: "interior",
    },
    {
      id: `${propertyId}-5`,
      url: `https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&seed=${seed + 4}`,
      caption: "Aerial neighborhood view",
      type: "aerial",
    },
    {
      id: `${propertyId}-6`,
      url: `https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80&seed=${seed + 5}`,
      caption: "Street view",
      type: "street",
    },
  ];
};

const typeLabels: Record<string, string> = {
  exterior: "Exterior",
  interior: "Interior",
  aerial: "Aerial",
  street: "Street",
  other: "Other",
};

export function PropertyImageGallery({
  propertyId,
  images: providedImages,
  className,
}: PropertyImageGalleryProps) {
  const images = providedImages || generateMockImages(propertyId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState<string | null>(null);

  const filteredImages = filter
    ? images.filter((img) => img.type === filter)
    : images;

  const currentImage = filteredImages[selectedIndex] || filteredImages[0];

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % filteredImages.length);
    setZoom(1);
  }, [filteredImages.length]);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    setZoom(1);
  }, [filteredImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 3));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goToNext, goToPrev]);

  // Get unique types for filter
  const availableTypes = Array.from(new Set(images.map((img) => img.type).filter(Boolean)));

  if (images.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
          <ImageIcon className="h-10 w-10" />
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("rounded-xl border border-border bg-card", className)}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Property Photos</h3>
            <span className="text-xs text-muted-foreground">({images.length})</span>
          </div>

          {/* Type filter */}
          {availableTypes.length > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => setFilter(null)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                  filter === null
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilter(type!);
                    setSelectedIndex(0);
                  }}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                    filter === type
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {typeLabels[type!] || type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main image */}
        <div
          className="relative aspect-video cursor-pointer overflow-hidden bg-muted"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={currentImage.url}
            alt={currentImage.caption || "Property image"}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, 600px"
          />

          {/* Navigation arrows */}
          {filteredImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-[10px] font-medium text-foreground backdrop-blur-sm">
            {selectedIndex + 1} / {filteredImages.length}
          </div>

          {/* Expand button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Open fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Caption */}
          {currentImage.caption && (
            <div className="absolute bottom-10 left-2 right-2 rounded-md bg-background/80 px-2 py-1 text-[11px] text-foreground backdrop-blur-sm">
              {currentImage.caption}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex gap-1 overflow-x-auto p-2">
          {filteredImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md transition-all",
                index === selectedIndex
                  ? "ring-2 ring-primary"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={image.url}
                alt={image.caption || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Controls */}
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.max(z - 0.25, 0.5));
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.min(z + 0.25, 3));
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(currentImage.url, "_blank");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLightboxOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[90vw] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.caption || "Property image"}
              width={1200}
              height={800}
              className="object-contain transition-transform"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>

          {/* Navigation */}
          {filteredImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Caption and counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm text-white/90">
              {selectedIndex + 1} of {filteredImages.length}
            </p>
            {currentImage.caption && (
              <p className="mt-1 text-xs text-white/70">{currentImage.caption}</p>
            )}
          </div>

          {/* Zoom indicator */}
          {zoom !== 1 && (
            <div className="absolute bottom-4 right-4 rounded-md bg-white/10 px-2 py-1 text-xs text-white">
              {Math.round(zoom * 100)}%
            </div>
          )}
        </div>
      )}
    </>
  );
}
