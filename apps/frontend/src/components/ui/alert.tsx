import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 text-sm transition-all [&>svg]:size-4 [&>svg]:shrink-0 flex items-start gap-3",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground border-border",
        destructive:
          "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 [&>svg]:text-red-500",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400 [&>svg]:text-emerald-500",
        warning:
          "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400 [&>svg]:text-amber-500",
        info:
          "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", role, ...props }, ref) => {
    const defaultRole = variant === "destructive" ? "alert" : "status";

    return (
      <div
        ref={ref}
        role={role ?? defaultRole}
        data-slot="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("font-medium leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-xs text-muted-foreground leading-relaxed mt-1", className)}
      {...props}
    />
  )
);
AlertDescription.displayName = "AlertDescription";
