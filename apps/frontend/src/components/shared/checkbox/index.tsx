import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  /**
   * Visual variant. "default" is an inline checkbox with optional label.
   * "card" is an Apple-inspired prominent selectable card container.
   */
  variant?: "default" | "card";
  /**
   * Primary label text or element.
   */
  label?: ReactNode;
  /**
   * Optional helper description rendered below label.
   */
  description?: ReactNode;
  /**
   * Optional error message rendered below the checkbox.
   */
  error?: string;
  /**
   * Controlled checked state.
   */
  checked?: boolean;
  /**
   * Callback invoked when checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Native change event handler.
   */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /**
   * Container element class name.
   */
  containerClassName?: string;
}

export function Checkbox({
  ref,
  variant = "default",
  label,
  description,
  error,
  checked: controlledChecked,
  defaultChecked,
  onCheckedChange,
  onChange,
  disabled = false,
  required = false,
  className,
  containerClassName,
  id,
  name,
  value,
  ...props
}: CheckboxProps & { ref?: Ref<HTMLInputElement> }) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [uncontrolledChecked, setUncontrolledChecked] = useState(
    Boolean(defaultChecked)
  );

  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isControlled) {
      setUncontrolledChecked(e.target.checked);
    }
    onCheckedChange?.(e.target.checked);
    onChange?.(e);
  };

  const handleContainerClick = () => {
    if (disabled) return;
    const nextChecked = !isChecked;
    if (!isControlled) {
      setUncontrolledChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleContainerClick();
    }
  };

  // Apple-inspired visual indicator
  const indicator = (
    <div
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150 ease-out",
        isChecked
          ? "border-primary bg-primary text-white shadow-xs"
          : error
          ? "border-destructive bg-card"
          : "border-border bg-card hover:border-zinc-400 dark:hover:border-zinc-600",
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {isChecked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
    </div>
  );

  if (variant === "card") {
    return (
      <div className={cn("w-full", containerClassName)}>
        <div
          role="checkbox"
          tabIndex={disabled ? -1 : 0}
          aria-checked={isChecked}
          aria-disabled={disabled}
          aria-required={required}
          onClick={handleContainerClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
            isChecked
              ? "border-primary bg-blue-50/50 dark:bg-blue-950/20"
              : error
              ? "border-destructive bg-card"
              : "border-border bg-card hover:border-zinc-300 dark:hover:border-zinc-700",
            disabled && "cursor-not-allowed opacity-40 pointer-events-none"
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            name={name}
            value={value}
            checked={isChecked}
            onChange={handleInputChange}
            disabled={disabled}
            required={required}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            {...props}
          />
          <div className="mt-0.5">{indicator}</div>
          <div className="select-none">
            {label && (
              <span className="block text-sm font-semibold text-foreground">
                {label}
              </span>
            )}
            {description && (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={cn("inline-flex flex-col", containerClassName)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex cursor-pointer items-start gap-3 select-none py-1",
          disabled && "cursor-not-allowed opacity-40"
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          name={name}
          value={value}
          checked={isChecked}
          onChange={handleInputChange}
          disabled={disabled}
          required={required}
          className="sr-only"
          {...props}
        />
        <div className="mt-0.5">{indicator}</div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            )}
            {description && (
              <span className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
