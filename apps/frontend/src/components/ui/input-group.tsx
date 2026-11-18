import { forwardRef, type HTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const InputGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="input-group"
      className={cn(
        "group/input-group relative flex h-11 has-[textarea]:h-auto w-full min-w-0 items-center overflow-hidden rounded-xl border border-input bg-secondary text-foreground transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:bg-card",
        className
      )}
      {...props}
    />
  )
);
InputGroup.displayName = "InputGroup";

export const inputGroupAddonVariants = cva(
  "flex h-auto items-center justify-center px-3 text-muted-foreground select-none [&>svg]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first",
        "inline-end": "order-last",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
);

export const InputGroupAddon = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & VariantProps<typeof inputGroupAddonVariants>
>(({ className, align = "inline-start", ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group-addon"
    className={cn(inputGroupAddonVariants({ align }), className)}
    {...props}
  />
));
InputGroupAddon.displayName = "InputGroupAddon";

export const InputGroupInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      data-slot="input-group-control"
      className={cn(
        "flex h-full w-full min-w-0 rounded-[inherit] bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
InputGroupInput.displayName = "InputGroupInput";

export const InputGroupTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      data-slot="input-group-control"
      className={cn(
        "flex min-h-[80px] w-full min-w-0 resize-y rounded-[inherit] bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
InputGroupTextarea.displayName = "InputGroupTextarea";
