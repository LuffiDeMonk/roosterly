import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 ease-out outline-none select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-blue-700 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-zinc-200 active:bg-zinc-300 border border-border dark:hover:bg-zinc-800",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted active:bg-zinc-200 dark:hover:bg-zinc-800",
        ghost:
          "text-foreground hover:bg-muted active:bg-zinc-200 dark:hover:bg-zinc-800",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-600 active:bg-red-700 shadow-sm",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
        text:
          "text-primary hover:opacity-80 p-0 h-auto font-medium",
      },
      size: {
        default: "h-11 px-5 text-sm", // 44px Apple standard
        sm: "h-9 px-3.5 text-xs rounded-lg",
        lg: "h-12 px-6 text-base rounded-xl",
        icon: "size-11 p-0", // 44px Apple target
        "icon-sm": "size-9 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      asChild = false,
      icon,
      iconPosition = "left",
      startIcon,
      endIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : "button";
    const effectiveStartIcon = startIcon || (iconPosition === "left" ? icon : undefined);
    const effectiveEndIcon = endIcon || (iconPosition === "right" ? icon : undefined);

    if (asChild) {
      return (
        <Component
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Component>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {loading ? (
          <Spinner className="size-4 animate-spin" />
        ) : (
          effectiveStartIcon && <span className="inline-flex shrink-0">{effectiveStartIcon}</span>
        )}
        {children}
        {!loading && effectiveEndIcon && (
          <span className="inline-flex shrink-0">{effectiveEndIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
