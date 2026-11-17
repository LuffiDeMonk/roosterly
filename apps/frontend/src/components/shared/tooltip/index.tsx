import {
  useState,
  useRef,
  useCallback,
  isValidElement,
  type ReactNode,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type FocusEvent,
} from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export type TooltipPlacement =
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "leftTop"
  | "leftBottom"
  | "rightTop"
  | "rightBottom";

export type TooltipTriggerType = "hover" | "focus" | "click" | "contextMenu";

const PLACEMENT_MAP: Record<
  TooltipPlacement,
  {
    side: "top" | "bottom" | "left" | "right";
    align: "start" | "center" | "end";
  }
> = {
  top: { side: "top", align: "center" },
  topLeft: { side: "top", align: "start" },
  topRight: { side: "top", align: "end" },
  bottom: { side: "bottom", align: "center" },
  bottomLeft: { side: "bottom", align: "start" },
  bottomRight: { side: "bottom", align: "end" },
  left: { side: "left", align: "center" },
  leftTop: { side: "left", align: "start" },
  leftBottom: { side: "left", align: "end" },
  right: { side: "right", align: "center" },
  rightTop: { side: "right", align: "start" },
  rightBottom: { side: "right", align: "end" },
};

const PRESET_COLORS: Record<string, string> = {
  pink: "rgb(236 72 153)",
  red: "rgb(239 68 68)",
  yellow: "rgb(234 179 8)",
  orange: "rgb(249 115 22)",
  cyan: "rgb(6 182 212)",
  green: "rgb(34 197 94)",
  blue: "rgb(59 130 246)",
  purple: "rgb(168 85 247)",
};

export interface TooltipProps {
  /** The content to show in the tooltip popup */
  title?: ReactNode | (() => ReactNode);
  /** The position of the tooltip relative to the target */
  placement?: TooltipPlacement;
  /** How the tooltip is triggered: 'hover' | 'focus' | 'click' | 'contextMenu' */
  trigger?: TooltipTriggerType | TooltipTriggerType[];
  /** Controlled open state */
  open?: boolean;
  /** Uncontrolled initial open state */
  defaultOpen?: boolean;
  /** Callback executed when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Background color of the tooltip */
  color?: string;
  /** Whether to show the arrow pointer */
  arrow?: boolean | { pointAtCenter?: boolean };
  /** Delay in seconds before showing tooltip on hover */
  mouseEnterDelay?: number;
  /** Delay in seconds before hiding tooltip on hover */
  mouseLeaveDelay?: number;
  /** Custom CSS class for the tooltip overlay */
  overlayClassName?: string;
  className?: string;
  /** Custom inline style for the tooltip overlay */
  overlayStyle?: CSSProperties;
  style?: CSSProperties;
  /** z-index of the tooltip popup */
  zIndex?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Target element that triggers the tooltip */
  children: ReactNode;
}

export function Tooltip({
  title,
  placement = "top",
  trigger = "hover",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  color,
  arrow = true,
  mouseEnterDelay = 0.1,
  mouseLeaveDelay = 0.1,
  overlayClassName,
  className,
  overlayStyle,
  style,
  zIndex = 50,
  disabled = false,
  children,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const triggers = Array.isArray(trigger) ? trigger : [trigger];
  const triggerHover = triggers.includes("hover");
  const triggerFocus = triggers.includes("focus");
  const triggerClick = triggers.includes("click");
  const triggerContextMenu = triggers.includes("contextMenu");

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const renderedTitle = typeof title === "function" ? title() : title;
  const hasTitle =
    renderedTitle !== null &&
    renderedTitle !== undefined &&
    renderedTitle !== "";

  if (disabled || !hasTitle) {
    return children;
  }

  const { side, align } = PLACEMENT_MAP[placement] || PLACEMENT_MAP.top;
  const resolvedBgColor = color ? PRESET_COLORS[color] || color : undefined;

  const handleClick = () => {
    if (triggerClick) {
      handleOpenChange(!isOpen);
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (triggerClick) {
      e.preventDefault();
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!triggerHover) {
      e.preventDefault();
    }
  };

  const handlePointerLeave = (e: PointerEvent) => {
    if (!triggerHover) {
      e.preventDefault();
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    if (triggerContextMenu) {
      e.preventDefault();
      handleOpenChange(!isOpen);
    }
  };

  const handleFocus = (e: FocusEvent) => {
    if (!triggerFocus) {
      e.preventDefault();
    } else {
      handleOpenChange(true);
    }
  };

  const handleBlur = (e: FocusEvent) => {
    if (!triggerFocus) {
      e.preventDefault();
    } else if (!triggerClick) {
      handleOpenChange(false);
    }
  };

  const triggerElement = isValidElement(children) ? (
    children
  ) : (
    <span>{children}</span>
  );

  return (
    <TooltipPrimitive.Provider
      delayDuration={triggerHover ? mouseEnterDelay * 1000 : 0}
      skipDelayDuration={mouseLeaveDelay * 1000}
    >
      <TooltipPrimitive.Root
        open={isOpen}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
      >
        <TooltipPrimitive.Trigger
          asChild
          ref={triggerRef}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {triggerElement}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            onPointerDownOutside={(e) => {
              if (
                triggerClick &&
                triggerRef.current?.contains(e.target as Node)
              ) {
                e.preventDefault();
              }
            }}
            style={{
              zIndex,
              ...(resolvedBgColor
                ? {
                    backgroundColor: resolvedBgColor,
                    borderColor: resolvedBgColor,
                  }
                : {}),
              ...overlayStyle,
              ...style,
            }}
            className={cn(
              "z-50 max-w-xs rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-md dark:bg-zinc-800 dark:text-zinc-100",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1",
              overlayClassName,
              className
            )}
          >
            {renderedTitle}
            {arrow && (
              <TooltipPrimitive.Arrow
                className="fill-zinc-900 dark:fill-zinc-800"
                style={resolvedBgColor ? { fill: resolvedBgColor } : undefined}
                width={8}
                height={4}
              />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
