import {
  type HTMLAttributes,
  type ReactNode,
  useRef,
  useState,
  useEffect,
  useCallback,
  Children,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  gap?: number;
}

export function Carousel({
  children,
  title,
  subtitle,
  action,
  gap = 16,
  className,
  ...props
}: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative w-full space-y-4", className)} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-end justify-between px-1">
          <div>
            {title && (
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
                aria-label="Next slide"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex overflow-x-auto scroll-smooth pb-2 pt-1 scrollbar-none"
        style={{ gap: `${gap}px` }}
      >
        {Children.map(children, (child, idx) => (
          <div key={idx} className="shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
