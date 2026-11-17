import { useState, useRef, type MouseEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageZoom } from "./image-zoom";
import { ImageZoomLightbox } from "./image-zoom-lightbox";
import type { ImageZoomGalleryProps } from "./types";

export function ImageZoomGallery({
  images,
  selectedIndex,
  defaultIndex = 0,
  onIndexChange,
  thumbnailPosition = "bottom",
  thumbnailTrigger = "hover",
  thumbnailSize = 64,
  thumbnailGap = 10,
  showNavigationArrows = true,
  enableLightbox = true,
  zoomProps,
  thumbnailsClassName,
  thumbnailItemClassName,
  badge,
  className,
  ...props
}: ImageZoomGalleryProps) {
  const [internalIndex, setInternalIndex] = useState<number>(defaultIndex);
  const activeIndex =
    selectedIndex !== undefined ? selectedIndex : internalIndex;

  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const thumbnailsContainerRef = useRef<HTMLDivElement | null>(null);

  const handleSelectImage = (index: number) => {
    if (selectedIndex === undefined) {
      setInternalIndex(index);
    }
    onIndexChange?.(index);
  };

  const handlePrev = (e?: MouseEvent) => {
    e?.stopPropagation();
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : images.length - 1;
    handleSelectImage(nextIdx);
  };

  const handleNext = (e?: MouseEvent) => {
    e?.stopPropagation();
    const nextIdx = activeIndex < images.length - 1 ? activeIndex + 1 : 0;
    handleSelectImage(nextIdx);
  };

  const scrollThumbnails = (direction: "prev" | "next") => {
    if (!thumbnailsContainerRef.current) return;
    const isVertical =
      thumbnailPosition === "left" || thumbnailPosition === "right";
    const delta = (thumbnailSize + thumbnailGap) * 2;
    if (isVertical) {
      thumbnailsContainerRef.current.scrollBy({
        top: direction === "next" ? delta : -delta,
        behavior: "smooth",
      });
    } else {
      thumbnailsContainerRef.current.scrollBy({
        left: direction === "next" ? delta : -delta,
        behavior: "smooth",
      });
    }
  };

  const currentImage = images[activeIndex] || images[0];
  if (!currentImage) return null;

  const isVertical =
    thumbnailPosition === "left" || thumbnailPosition === "right";

  const renderThumbnails = () => {
    if (images.length <= 1) return null;

    return (
      <div
        className={cn(
          "relative flex items-center group/thumbs",
          isVertical ? "flex-col justify-center" : "flex-row justify-center",
          thumbnailPosition === "left" && "order-1",
          thumbnailPosition === "right" && "order-2",
          thumbnailsClassName
        )}
      >
        {/* Scroll back arrow */}
        <button
          type="button"
          aria-label="Scroll thumbnails backward"
          onClick={() => scrollThumbnails("prev")}
          className={cn(
            "z-10 flex size-7 items-center justify-center rounded-full bg-card/90 shadow-xs border border-border text-muted-foreground hover:text-foreground transition-all",
            isVertical
              ? "mb-1"
              : "absolute -left-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/thumbs:opacity-100"
          )}
        >
          {isVertical ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>

        {/* Thumbnails scrollable strip */}
        <div
          ref={thumbnailsContainerRef}
          className={cn(
            "flex gap-2.5 overflow-auto no-scrollbar scroll-smooth p-1",
            isVertical ? "flex-col max-h-[460px]" : "flex-row max-w-full"
          )}
        >
          {images.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={img.id ?? idx}
                type="button"
                onClick={() => handleSelectImage(idx)}
                onMouseEnter={() => {
                  if (thumbnailTrigger === "hover") {
                    handleSelectImage(idx);
                  }
                }}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-xl border transition-all cursor-pointer bg-card",
                  isSelected
                    ? "border-primary ring-2 ring-primary/25 shadow-xs"
                    : "border-border opacity-70 hover:opacity-100 hover:border-zinc-400 dark:hover:border-zinc-600",
                  thumbnailItemClassName
                )}
                style={{
                  width: thumbnailSize,
                  height: thumbnailSize,
                }}
              >
                <img
                  src={img.thumbnail || img.src}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  className="h-full w-full object-contain p-1"
                />
              </button>
            );
          })}
        </div>

        {/* Scroll forward arrow */}
        <button
          type="button"
          aria-label="Scroll thumbnails forward"
          onClick={() => scrollThumbnails("next")}
          className={cn(
            "z-10 flex size-7 items-center justify-center rounded-full bg-card/90 shadow-xs border border-border text-muted-foreground hover:text-foreground transition-all",
            isVertical
              ? "mt-1"
              : "absolute -right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/thumbs:opacity-100"
          )}
        >
          {isVertical ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-4 select-none",
        isVertical ? "flex-row items-start" : "flex-col",
        className
      )}
      {...props}
    >
      {/* Thumbnails (when positioned left) */}
      {thumbnailPosition === "left" && renderThumbnails()}

      {/* Main Image Container */}
      <div className="relative flex-1 group/gallery rounded-2xl border border-border bg-card p-2">
        <ImageZoom
          src={currentImage.src}
          zoomSrc={currentImage.zoomSrc}
          alt={currentImage.alt || "Product image"}
          onImageClick={() => {
            if (enableLightbox) {
              setIsLightboxOpen(true);
            }
          }}
          overlay={
            <>
              {/* Optional Badges */}
              {(badge || currentImage.badge) && (
                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                  {currentImage.badge || badge}
                </div>
              )}

              {/* Lightbox trigger button */}
              {enableLightbox && (
                <button
                  type="button"
                  aria-label="Open image in fullscreen"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute bottom-3 right-3 z-20 flex size-8 items-center justify-center rounded-full bg-card/80 hover:bg-card text-foreground shadow-xs backdrop-blur-md transition-all pointer-events-auto opacity-0 group-hover/gallery:opacity-100"
                >
                  <Maximize2 className="size-4" />
                </button>
              )}
            </>
          }
          {...zoomProps}
        />

        {/* Main image next/prev buttons */}
        {showNavigationArrows && images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex size-8 items-center justify-center rounded-full bg-card/80 hover:bg-card text-foreground shadow-xs backdrop-blur-md transition-all opacity-0 group-hover/gallery:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex size-8 items-center justify-center rounded-full bg-card/80 hover:bg-card text-foreground shadow-xs backdrop-blur-md transition-all opacity-0 group-hover/gallery:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails (when positioned right or bottom) */}
      {(thumbnailPosition === "right" || thumbnailPosition === "bottom") &&
        renderThumbnails()}

      {/* Fullscreen Lightbox Modal */}
      {enableLightbox && (
        <ImageZoomLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={images}
          initialIndex={activeIndex}
        />
      )}
    </div>
  );
}
