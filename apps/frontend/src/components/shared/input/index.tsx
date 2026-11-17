import { useId, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/shared/label";
import { cn } from "@/lib/utils";

export interface InputProps extends ComponentProps<typeof InputGroupInput> {
  /**
   * Label text rendered above the input.
   */
  label?: ReactNode;
  /**
   * Optional custom className for the label.
   */
  labelClassName?: string;
  /**
   * Optional variant for the label (default, uppercase, muted).
   * Defaults to 'default' per design system rules.
   */
  labelVariant?: "default" | "uppercase" | "muted";
  /**
   * Error message rendered below the input. Also sets the invalid state.
   */
  error?: string;
  /**
   * Helper text rendered below the input when there is no error.
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
  /**
   * When true, strips common SQL-injection patterns from the value before it
   * propagates to `onChange` and to the field itself.
   */
  preventSqlInjection?: boolean;
  /**
   * Additional SQL-injection patterns to strip, merged with the defaults.
   */
  sqlInjectionPatterns?: RegExp[];
}

const DEFAULT_SQL_PATTERNS: RegExp[] = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b/gi,
  /--|\/\*|\*\/|;/g,
  /\b(OR|AND)\b\s+['"]?[^'"]*['"]?\s*=\s*['"]?[^'"]*['"]?/gi,
];

export function sanitizeSqlInjection(
  value: string,
  extraPatterns: RegExp[] = []
): string {
  return [...DEFAULT_SQL_PATTERNS, ...extraPatterns].reduce(
    (result, pattern) => result.replace(pattern, ""),
    value
  );
}

export function Input({
  className,
  type = "text",
  label,
  labelClassName,
  labelVariant = "default",
  error,
  helperText,
  startIcon,
  endIcon,
  preventSqlInjection = false,
  sqlInjectionPatterns = [],
  onChange,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (preventSqlInjection) {
      const sanitized = sanitizeSqlInjection(
        event.target.value,
        sqlInjectionPatterns
      );
      if (sanitized !== event.target.value) {
        event.target.value = sanitized;
      }
    }

    onChange?.(event);
  };

  const controlProps = {
    id: inputId,
    type,
    "aria-invalid": error ? true : undefined,
    "aria-describedby":
      [errorId, helperId].filter(Boolean).join(" ") || undefined,
    onChange: handleChange,
    ...props,
  };

  return (
    <div className="w-full">
      {label && (
        <Label
          htmlFor={inputId}
          variant={labelVariant}
          className={cn("mb-2 block text-sm font-medium text-foreground", labelClassName)}
        >
          {label}
        </Label>
      )}

      <InputGroup
        className={cn(
          error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
          className
        )}
      >
        {startIcon && (
          <InputGroupAddon align="inline-start" className="text-muted-foreground">
            {startIcon}
          </InputGroupAddon>
        )}
        <InputGroupInput {...controlProps} />
        {endIcon && (
          <InputGroupAddon align="inline-end" className="text-muted-foreground">
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
