import { useId, type ComponentProps, type ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/shared/label";
import { cn } from "@/lib/utils";

export interface TextareaProps extends ComponentProps<typeof InputGroupTextarea> {
  /**
   * Label text rendered above the textarea.
   */
  label?: string;
  /**
   * Error message rendered below the textarea. Also sets the invalid state.
   */
  error?: string;
  /**
   * Helper text rendered below the textarea when there is no error.
   */
  helperText?: string;
  /**
   * Content rendered before the control, typically an icon.
   */
  startIcon?: ReactNode;
  /**
   * Content rendered after the control, typically an icon.
   */
  endIcon?: ReactNode;
}

export function Textarea({
  className,
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  id,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText ? `${textareaId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <Label
          htmlFor={textareaId}
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {label}
        </Label>
      )}

      <InputGroup
        className={cn(
          "h-auto min-h-[100px] items-start p-1",
          error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
          className
        )}
      >
        {startIcon && (
          <InputGroupAddon align="inline-start" className="pt-2 text-muted-foreground">
            {startIcon}
          </InputGroupAddon>
        )}
        <InputGroupTextarea
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [errorId, helperId].filter(Boolean).join(" ") || undefined
          }
          className="min-h-[90px]"
          {...props}
        />
        {endIcon && (
          <InputGroupAddon align="inline-end" className="pt-2 text-muted-foreground">
            {endIcon}
          </InputGroupAddon>
        )}
      </InputGroup>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}
