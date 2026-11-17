import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label as UiLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const labelVariants = cva(
  "leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "font-medium text-foreground",
        uppercase: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        muted: "font-medium text-muted-foreground",
        destructive: "font-medium text-destructive",
      },
      size: {
        xs: "text-xs",
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    compoundVariants: [
      {
        variant: "uppercase",
        size: "default",
        className: "text-xs",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LabelProps
  extends ComponentPropsWithoutRef<typeof UiLabel>,
    VariantProps<typeof labelVariants> {
  /**
   * If true, displays a red asterisk (*) indicating a required field.
   */
  required?: boolean;
  /**
   * If true, displays a subtle "(optional)" indicator.
   */
  optional?: boolean;
  /**
   * Optional helper or description text rendered below the label.
   */
  description?: ReactNode;
}

export const Label = forwardRef<ElementRef<typeof UiLabel>, LabelProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      required = false,
      optional = false,
      description,
      children,
      ...props
    },
    ref
  ) => {
    const labelContent = (
      <UiLabel
        ref={ref}
        className={cn(labelVariants({ variant, size }), className)}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 font-semibold text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {optional && (
          <span className="ml-1 text-xs font-normal normal-case tracking-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </UiLabel>
    );

    if (description) {
      return (
        <div className="space-y-1">
          {labelContent}
          <p className="text-xs font-normal text-muted-foreground">
            {description}
          </p>
        </div>
      );
    }

    return labelContent;
  }
);

Label.displayName = "Label";

export default Label;
