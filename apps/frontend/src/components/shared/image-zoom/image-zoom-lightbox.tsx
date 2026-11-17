import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageZoomLightboxProps } from "./types";

export function ImageZoomLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: ImageZoomLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && typeof document !== "undefined") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || !isMounted || typeof document === "undefined" || !currentImage) {
    return null;
  }

  const lightboxContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl animate-in fade-in-0 duration-200 select-none"
    >
      {/* Top Bar Controls */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-50 text-white">
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
          {currentIndex + 1} / {images.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={handleZoomIn}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={handleZoomOut}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
          >
            <ZoomOut className="size-4" />
          </button>
          {scale > 1 && (
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={handleResetZoom}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="Close lightbox"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md ml-2"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      {/* Main Image Viewport */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={cn(
          "relative flex h-full w-full items-center justify-center p-8 overflow-hidden",
          scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        )}
      >
        <img
          src={currentImage.zoomSrc || currentImage.src}
          alt={currentImage.alt || "Product image"}
          className="max-h-[85vh] max-w-[85vw] object-contain transition-transform duration-100 ease-out pointer-events-none rounded-xl"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          }}
        />
      </div>

      {/* Caption if provided */}
      {currentImage.caption && (
        <div className="absolute bottom-6 inset-x-8 text-center text-sm font-medium text-white/90 z-50 pointer-events-none">
          {currentImage.caption}
        </div>
      )}
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
