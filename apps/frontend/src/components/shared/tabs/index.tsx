import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}

export interface CustomTabsProps {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
  orientation?: "horizontal" | "vertical";
}

interface TabTriggerItemProps {
  item: TabItem;
  isActive: boolean;
}

function TabTriggerItem({ item, isActive }: TabTriggerItemProps) {
  return (
    <TabsTrigger
      key={item.key}
      value={item.key}
      disabled={item.disabled}
      data-active={isActive ? "true" : undefined}
      className="relative flex items-center gap-2 cursor-pointer"
    >
      {item.icon && (
        <span className="flex items-center justify-center shrink-0">
          {item.icon}
        </span>
      )}
      <span>{item.label}</span>
    </TabsTrigger>
  );
}

export default function CustomTabs({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  className,
  listClassName,
  contentClassName,
  orientation = "horizontal",
}: CustomTabsProps) {
  const isControlled = activeKey !== undefined;
  const currentKey = isControlled
    ? activeKey
    : defaultActiveKey || items[0]?.key;

  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || orientation === "vertical") return;
    const hasScroll = el.scrollWidth > el.clientWidth + 1;
    setCanScrollLeft(hasScroll && el.scrollLeft > 4);
    setCanScrollRight(
      hasScroll && el.scrollLeft < el.scrollWidth - el.clientWidth - 4
    );
  }, [orientation]);

  useEffect(() => {
    checkScroll();
    const el = listRef.current;
    if (!el || orientation === "vertical") return;

    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [checkScroll, items, orientation]);

  // Auto-scroll active tab into view smoothly
  useEffect(() => {
    const el = listRef.current;
    if (!el || orientation === "vertical") return;

    const activeEl = el.querySelector<HTMLElement>(
      `[data-slot="tabs-trigger"][data-state="active"], [data-slot="tabs-trigger"][data-active="true"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    checkScroll();
  }, [currentKey, orientation, checkScroll]);

  return (
    <ShadcnTabs
      value={isControlled ? activeKey : undefined}
      defaultValue={
        !isControlled ? defaultActiveKey || items[0]?.key : undefined
      }
      onValueChange={onChange}
      orientation={orientation}
      className={cn(
        "w-full min-w-0 max-w-full flex",
        orientation === "vertical" ? "flex-row gap-6" : "flex-col",
        className
      )}
    >
      <div className="relative w-full min-w-0 max-w-full">
        {orientation === "horizontal" && canScrollLeft && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-r from-background to-transparent"
            aria-hidden="true"
          />
        )}

        <TabsList
          ref={listRef}
          className={cn("scroll-smooth min-w-0 max-w-full", listClassName)}
          onScroll={checkScroll}
        >
          {items.map((item) => (
            <TabTriggerItem
              key={item.key}
              item={item}
              isActive={currentKey === item.key}
            />
          ))}
        </TabsList>

        {orientation === "horizontal" && canScrollRight && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-l from-background to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {items.map(
        (item) =>
          item.children && (
            <TabsContent
              key={item.key}
              value={item.key}
              className={cn("mt-4 outline-none w-full", contentClassName)}
            >
              {item.children}
            </TabsContent>
          )
      )}
    </ShadcnTabs>
  );
}

export { CustomTabs, CustomTabs as Tabs };
