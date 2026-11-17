import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  forwardRef,
  type MouseEvent,
  type TouchEvent,
  type KeyboardEvent,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageZoomProps, ZoomPlacement, ZoomType } from "./types";

export const ImageZoom = forwardRef<HTMLDivElement, ImageZoomProps>(
  (
    {
      src,
      zoomSrc,
      alt = "Product image",
      zoomType = "side",
      zoomScale = 2.5,
      zoomPlacement = "right",
      zoomGap = 16,
      zoomWindowWidth = 500,
      zoomWindowHeight = 500,
      lensWidth,
      lensHeight,
      showLens = true,
      lensClassName,
      zoomWindowClassName,
      imageClassName,
      zoomImageClassName,
      containerClassName,
      portal = false,
      portalContainer,
      autoResponsive = true,
      aspectRatio = "1/1",
      preloadZoom = false,
      onZoomStart,
      onZoomEnd,
      onImageClick,
      loadingPlaceholder,
      disabled = false,
      tapToZoom = true,
      overlay,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mainImageRef = useRef<HTMLImageElement | null>(null);
    const lensRef = useRef<HTMLDivElement | null>(null);
    const zoomWindowRef = useRef<HTMLDivElement | null>(null);
    const zoomImageRef = useRef<HTMLImageElement | null>(null);

    // States
    const [isZoomed, setIsZoomed] = useState<boolean>(false);
    const [isLoadingZoom, setIsLoadingZoom] = useState<boolean>(
      Boolean(zoomSrc && zoomSrc !== src)
    );
    const [isMounted, setIsMounted] = useState<boolean>(false);
    const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
    const [containerSize, setContainerSize] = useState<{
      width: number;
      height: number;
    }>({
      width: 0,
      height: 0,
    });
    const [lensPos, setLensPos] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const [zoomOffset, setZoomOffset] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const [portalCoords, setPortalCoords] = useState<{
      top: number;
      left: number;
    }>({ top: 0, left: 0 });
    const [innerOrigin, setInnerOrigin] = useState<{ x: number; y: number }>({
      x: 50,
      y: 50,
    });
    const [lensLoupeOffset, setLensLoupeOffset] = useState<{
      x: number;
      y: number;
    }>({ x: 0, y: 0 });

    const rafIdRef = useRef<number | null>(null);
    const touchStartPosRef = useRef<{
      x: number;
      y: number;
      time: number;
    } | null>(null);

    // Track client mount and responsive screen detection
    useEffect(() => {
      setIsMounted(true);

      const checkScreen = () => {
        if (typeof window !== "undefined") {
          setIsSmallScreen(window.innerWidth < 768);
        }
      };

      checkScreen();
      window.addEventListener("resize", checkScreen);
      return () => window.removeEventListener("resize", checkScreen);
    }, []);

    // Preload high-res image if requested
    useEffect(() => {
      if (
        (preloadZoom || isZoomed) &&
        zoomSrc &&
        zoomSrc !== src &&
        typeof window !== "undefined"
      ) {
        const img = new Image();
        img.src = zoomSrc;
        img.onload = () => setIsLoadingZoom(false);
        img.onerror = () => setIsLoadingZoom(false);
      }
    }, [preloadZoom, isZoomed, zoomSrc, src]);

    const effectiveZoomType: ZoomType =
      autoResponsive && isSmallScreen ? "inner" : zoomType;

    const computedLensWidth = useMemo(() => {
      if (lensWidth) return lensWidth;
      const base = containerSize.width || 400;
      if (effectiveZoomType === "lens") {
        return Math.min(200, base * 0.45);
      }
      return Math.min(base * 0.5, zoomWindowWidth / zoomScale);
    }, [
      lensWidth,
      containerSize.width,
      effectiveZoomType,
      zoomWindowWidth,
      zoomScale,
    ]);

    const computedLensHeight = useMemo(() => {
      if (lensHeight) return lensHeight;
      const base = containerSize.height || 400;
      if (effectiveZoomType === "lens") {
        return Math.min(200, base * 0.45);
      }
      return Math.min(base * 0.5, zoomWindowHeight / zoomScale);
    }, [
      lensHeight,
      containerSize.height,
      effectiveZoomType,
      zoomWindowHeight,
      zoomScale,
    ]);

    const updateMeasurements = useCallback(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });

      if (portal) {
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        let top = 0;
        let left = 0;

        switch (zoomPlacement) {
          case "right":
            top = rect.top + scrollY;
            left = rect.right + scrollX + zoomGap;
            break;
          case "left":
            top = rect.top + scrollY;
            left = rect.left + scrollX - zoomGap - zoomWindowWidth;
            break;
          case "top":
            top = rect.top + scrollY - zoomGap - zoomWindowHeight;
            left = rect.left + scrollX;
            break;
          case "bottom":
            top = rect.bottom + scrollY + zoomGap;
            left = rect.left + scrollX;
            break;
        }

        setPortalCoords({ top, left });
      }
    }, [portal, zoomPlacement, zoomGap, zoomWindowWidth, zoomWindowHeight]);

    const handleCoordinates = useCallback(
      (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
          setIsZoomed(false);
          onZoomEnd?.();
          return;
        }

        if (effectiveZoomType === "inner") {
          const originX = Math.max(0, Math.min(100, (x / rect.width) * 100));
          const originY = Math.max(0, Math.min(100, (y / rect.height) * 100));
          setInnerOrigin({ x: originX, y: originY });

          if (mainImageRef.current) {
            mainImageRef.current.style.transformOrigin = `${originX}% ${originY}%`;
            mainImageRef.current.style.transform = `scale(${zoomScale})`;
          }
          return;
        }

        const lWidth =
          lensWidth ||
          (effectiveZoomType === "lens"
            ? Math.min(200, rect.width * 0.45)
            : Math.min(rect.width * 0.5, zoomWindowWidth / zoomScale));

        const lHeight =
          lensHeight ||
          (effectiveZoomType === "lens"
            ? Math.min(200, rect.height * 0.45)
            : Math.min(rect.height * 0.5, zoomWindowHeight / zoomScale));

        let lx = x - lWidth / 2;
        let ly = y - lHeight / 2;

        const maxLx = Math.max(0, rect.width - lWidth);
        const maxLy = Math.max(0, rect.height - lHeight);

        lx = Math.max(0, Math.min(lx, maxLx));
        ly = Math.max(0, Math.min(ly, maxLy));

        setLensPos({ x: lx, y: ly });

        if (effectiveZoomType === "side") {
          const rx = maxLx > 0 ? lx / maxLx : 0;
          const ry = maxLy > 0 ? ly / maxLy : 0;

          const zoomedWidth = rect.width * zoomScale;
          const zoomedHeight = rect.height * zoomScale;

          const maxScrollX = Math.max(0, zoomedWidth - zoomWindowWidth);
          const maxScrollY = Math.max(0, zoomedHeight - zoomWindowHeight);

          const offsetX = rx * maxScrollX;
          const offsetY = ry * maxScrollY;

          setZoomOffset({ x: offsetX, y: offsetY });

          if (zoomImageRef.current) {
            zoomImageRef.current.style.transform = `translate3d(${-offsetX}px, ${-offsetY}px, 0)`;
          }
          if (lensRef.current) {
            lensRef.current.style.top = "0px";
            lensRef.current.style.left = "0px";
            lensRef.current.style.width = `${lWidth}px`;
            lensRef.current.style.height = `${lHeight}px`;
            lensRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
          }
        } else if (effectiveZoomType === "lens") {
          const loupeX = -(x * zoomScale - lWidth / 2);
          const loupeY = -(y * zoomScale - lHeight / 2);
          setLensLoupeOffset({ x: loupeX, y: loupeY });

          if (lensRef.current) {
            lensRef.current.style.top = "0px";
            lensRef.current.style.left = "0px";
            lensRef.current.style.width = `${lWidth}px`;
            lensRef.current.style.height = `${lHeight}px`;
            lensRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
          }
          if (zoomImageRef.current) {
            zoomImageRef.current.style.transform = `translate3d(${loupeX}px, ${loupeY}px, 0)`;
          }
        }
      },
      [
        effectiveZoomType,
        lensWidth,
        lensHeight,
        zoomScale,
        zoomWindowWidth,
        zoomWindowHeight,
        onZoomEnd,
      ]
    );

    const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      updateMeasurements();
      setIsZoomed(true);
      onZoomStart?.();
      handleCoordinates(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
      if (disabled || !isZoomed) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        handleCoordinates(clientX, clientY);
      });
    };

    const handleMouseLeave = () => {
      if (disabled) return;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      setIsZoomed(false);
      onZoomEnd?.();

      if (effectiveZoomType === "inner" && mainImageRef.current) {
        mainImageRef.current.style.transform = "scale(1)";
        mainImageRef.current.style.transformOrigin = "center center";
      }
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartPosRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        updateMeasurements();
        if (!isZoomed && tapToZoom) {
          setIsZoomed(true);
          onZoomStart?.();
        }
        handleCoordinates(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
      if (disabled || !isZoomed) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleCoordinates(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (touchStartPosRef.current) {
        const touch = e.changedTouches[0];
        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
        const dt = Date.now() - touchStartPosRef.current.time;

        if (dx < 10 && dy < 10 && dt < 300 && tapToZoom) {
          setIsZoomed((prev) => {
            const next = !prev;
            if (next) onZoomStart?.();
            else onZoomEnd?.();
            return next;
          });
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsZoomed((prev) => {
          const next = !prev;
          if (next) {
            updateMeasurements();
            onZoomStart?.();
          } else {
            onZoomEnd?.();
          }
          return next;
        });
      } else if (e.key === "Escape" && isZoomed) {
        e.preventDefault();
        setIsZoomed(false);
        onZoomEnd?.();
      } else if (isZoomed && containerRef.current) {
        const step = 20;
        const rect = containerRef.current.getBoundingClientRect();
        let newX = lensPos.x + computedLensWidth / 2;
        let newY = lensPos.y + computedLensHeight / 2;

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          newX -= step;
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          newX += step;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          newY -= step;
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          newY += step;
        } else {
          return;
        }

        handleCoordinates(rect.left + newX, rect.top + newY);
      }
    };

    useEffect(() => {
      return () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      };
    }, []);

    const getInlinePlacementStyles = (
      placement: ZoomPlacement,
      gap: number
    ): CSSProperties => {
      switch (placement) {
        case "right":
          return { left: `calc(100% + ${gap}px)`, top: 0 };
        case "left":
          return { right: `calc(100% + ${gap}px)`, top: 0 };
        case "top":
          return { bottom: `calc(100% + ${gap}px)`, left: 0 };
        case "bottom":
          return { top: `calc(100% + ${gap}px)`, left: 0 };
      }
    };

    const renderFlyoutWindow = () => {
      if (effectiveZoomType !== "side") return null;

      const windowContent = (
        <div
          ref={zoomWindowRef}
          data-testid="zoom-window"
          aria-hidden="true"
          className={cn(
            "pointer-events-none z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-opacity duration-200",
            portal ? "fixed" : "absolute",
            isZoomed ? "opacity-100 visible" : "opacity-0 invisible",
            zoomWindowClassName
          )}
          style={{
            width: zoomWindowWidth,
            height: zoomWindowHeight,
            ...(portal
              ? { top: portalCoords.top, left: portalCoords.left }
              : getInlinePlacementStyles(zoomPlacement, zoomGap)),
          }}
        >
          <img
            ref={zoomImageRef}
            src={zoomSrc || src}
            alt={alt}
            data-testid="zoom-image"
            className={cn(
              "absolute top-0 left-0 max-w-none origin-top-left select-none",
              zoomImageClassName
            )}
            style={{
              top: 0,
              left: 0,
              width: (containerSize.width || 400) * zoomScale,
              height: (containerSize.height || 400) * zoomScale,
              transform: `translate3d(${-zoomOffset.x}px, ${-zoomOffset.y}px, 0)`,
              willChange: "transform",
            }}
            onLoad={() => setIsLoadingZoom(false)}
          />

          {isLoadingZoom && (
            <div
              data-testid="zoom-loading"
              className="absolute inset-0 flex items-center justify-center bg-card/70 backdrop-blur-[2px]"
            >
              {loadingPlaceholder || (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Loading image...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );

      if (portal && isMounted && typeof document !== "undefined") {
        return createPortal(windowContent, portalContainer || document.body);
      }

      return windowContent;
    };

    const renderLensLoupe = () => {
      if (effectiveZoomType !== "lens") return null;

      return (
        <div
          ref={lensRef}
          data-testid="lens-loupe"
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-40 overflow-hidden rounded-full border-2 border-white/90 shadow-2xl ring-2 ring-black/25 transition-opacity duration-150",
            isZoomed ? "opacity-100" : "opacity-0",
            lensClassName
          )}
          style={{
            top: 0,
            left: 0,
            width: computedLensWidth,
            height: computedLensHeight,
            transform: `translate3d(${lensPos.x}px, ${lensPos.y}px, 0)`,
            willChange: "transform",
          }}
        >
          <img
            ref={zoomImageRef}
            src={zoomSrc || src}
            alt={alt}
            className={cn(
              "absolute top-0 left-0 max-w-none origin-top-left select-none",
              zoomImageClassName
            )}
            style={{
              top: 0,
              left: 0,
              width: (containerSize.width || 400) * zoomScale,
              height: (containerSize.height || 400) * zoomScale,
              transform: `translate3d(${lensLoupeOffset.x}px, ${lensLoupeOffset.y}px, 0)`,
              willChange: "transform",
            }}
            onLoad={() => setIsLoadingZoom(false)}
          />
        </div>
      );
    };

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as any).current = node;
        }}
        data-testid="image-zoom-container"
        aria-label={alt}
        aria-expanded={isZoomed}
        tabIndex={disabled ? -1 : 0}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        onClick={onImageClick}
        className={cn(
          "group relative flex items-center justify-center select-none rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-card",
          effectiveZoomType === "inner" ? "overflow-hidden" : "overflow-visible",
          disabled ? "cursor-default" : "cursor-crosshair",
          containerClassName,
          className
        )}
        style={{
          aspectRatio: aspectRatio !== "auto" ? aspectRatio : undefined,
          ...style,
        }}
        {...props}
      >
        <img
          ref={mainImageRef}
          src={src}
          alt={alt}
          data-testid="main-image"
          className={cn(
            "h-full w-full object-contain pointer-events-none transition-transform duration-200 rounded-2xl",
            effectiveZoomType === "inner" && isZoomed && "will-change-transform",
            imageClassName
          )}
          style={
            effectiveZoomType === "inner"
              ? {
                  transform: isZoomed ? `scale(${zoomScale})` : "scale(1)",
                  transformOrigin: `${innerOrigin.x}% ${innerOrigin.y}%`,
                  transition: isZoomed
                    ? "transform 100ms ease-out"
                    : "transform 250ms ease-in-out",
                }
              : undefined
          }
        />

        {effectiveZoomType === "side" && showLens && (
          <div
            ref={lensRef}
            data-testid="zoom-lens"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-0 left-0 z-30 rounded-lg border border-primary/40 bg-primary/10 backdrop-blur-[0.5px] transition-opacity duration-150",
              isZoomed ? "opacity-100" : "opacity-0",
              lensClassName
            )}
            style={{
              top: 0,
              left: 0,
              width: computedLensWidth,
              height: computedLensHeight,
              transform: `translate3d(${lensPos.x}px, ${lensPos.y}px, 0)`,
              willChange: "transform",
            }}
          />
        )}

        {renderLensLoupe()}

        {renderFlyoutWindow()}

        {overlay && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {overlay}
          </div>
        )}
      </div>
    );
  }
);

ImageZoom.displayName = "ImageZoom";
