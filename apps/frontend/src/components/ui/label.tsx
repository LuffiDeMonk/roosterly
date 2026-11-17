import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const labelVariants = cva(
  "text-sm font-medium leading-none text-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        uppercase: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
      },
      size: {
        xs: "text-xs",
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LabelProps
  extends ComponentPropsWithoutRef<"label">,
    VariantProps<typeof labelVariants> {}

export const Label = forwardRef<ElementRef<"label">, LabelProps>(
  ({ className, variant, size, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Label.displayName = "Label";
