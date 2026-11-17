import {
  createContext,
  useContext,
  useId,
  useState,
  useCallback,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

// Context for RadioGroup
interface RadioGroupContextValue {
  name?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Currently selected value.
   */
  value?: string;
  /**
   * Default selected value for uncontrolled state.
   */
  defaultValue?: string;
  /**
   * Name applied to all radio inputs in this group.
   */
  name?: string;
  /**
   * Layout orientation.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Whether the entire radio group is disabled.
   */
  disabled?: boolean;
  /**
   * Callback invoked when selected value changes.
   */
  onValueChange?: (value: string) => void;
}

export function RadioGroup({
  ref,
  value: controlledValue,
  defaultValue,
  name: customName,
  orientation = "vertical",
  disabled = false,
  onValueChange,
  className,
  children,
  ...props
}: RadioGroupProps & { ref?: Ref<HTMLDivElement> }) {
  const generatedName = useId();
  const groupName = customName || generatedName;

  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue || ""
  );

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = useCallback(
    (val: string) => {
      if (!isControlled) {
        setUncontrolledValue(val);
      }
      onValueChange?.(val);
    },
    [isControlled, onValueChange]
  );

  return (
    <RadioGroupContext.Provider
      value={{
        name: groupName,
        value: activeValue,
        disabled,
        onChange: handleChange,
      }}
    >
      <div
        ref={ref}
        role="radiogroup"
        aria-orientation={orientation}
        className={cn(
          "flex",
          orientation === "horizontal"
            ? "flex-row items-center gap-6"
            : "flex-col gap-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  /**
   * Visual variant. "default" is an inline radio button with label.
   * "card" is an Apple-inspired selectable card container.
   */
  variant?: "default" | "card";
  /**
   * Value of this radio option.
   */
  value?: string;
  /**
   * Primary label text or element.
   */
  label?: ReactNode;
  /**
   * Optional helper description rendered below label.
   */
  description?: ReactNode;
  /**
   * Optional error message rendered below the radio option.
   */
  error?: string;
  /**
   * Controlled checked state when used outside of RadioGroup.
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

export function Radio({
  ref,
  variant = "default",
  value = "",
  label,
  description,
  error,
  checked: propChecked,
  defaultChecked,
  onCheckedChange,
  onChange,
  disabled: propDisabled = false,
  required = false,
  className,
  containerClassName,
  id,
  name: propName,
  ...props
}: RadioProps & { ref?: Ref<HTMLInputElement> }) {
  const groupContext = useContext(RadioGroupContext);
  const generatedId = useId();
  const inputId = id || generatedId;

  const [uncontrolledChecked, setUncontrolledChecked] = useState(
    Boolean(defaultChecked)
  );

  const isInsideGroup = Boolean(groupContext);
  const isChecked = isInsideGroup
    ? groupContext?.value === value
    : propChecked !== undefined
    ? propChecked
    : uncontrolledChecked;

  const isDisabled = propDisabled || Boolean(groupContext?.disabled);
  const radioName = propName || groupContext?.name;

  const handleSelect = () => {
    if (isDisabled) return;
    if (isInsideGroup) {
      groupContext?.onChange?.(value);
    } else {
      if (propChecked === undefined) {
        setUncontrolledChecked(true);
      }
    }
    onCheckedChange?.(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    handleSelect();
    onChange?.(e);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleSelect();
    }
  };

  // Apple-inspired visual radio indicator
  const indicator = (
    <div
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all duration-150 ease-out",
        isChecked
          ? "border-primary bg-primary text-white shadow-xs"
          : error
          ? "border-destructive bg-card"
          : "border-border bg-card hover:border-zinc-400 dark:hover:border-zinc-600",
        isDisabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {isChecked && (
        <div className="h-2 w-2 rounded-full bg-white" />
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <div className={cn("w-full", containerClassName)}>
        <div
          role="radio"
          tabIndex={isDisabled ? -1 : 0}
          aria-checked={isChecked}
          aria-disabled={isDisabled}
          aria-required={required}
          onClick={handleSelect}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
            isChecked
              ? "border-primary bg-blue-50/50 dark:bg-blue-950/20"
              : error
              ? "border-destructive bg-card"
              : "border-border bg-card hover:border-zinc-300 dark:hover:border-zinc-700",
            isDisabled && "cursor-not-allowed opacity-40 pointer-events-none"
          )}
        >
          <input
            ref={ref}
            type="radio"
            id={inputId}
            name={radioName}
            value={value}
            checked={isChecked}
            onChange={handleInputChange}
            disabled={isDisabled}
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
          "inline-flex cursor-pointer items-center gap-3 select-none py-1",
          isDisabled && "cursor-not-allowed opacity-40"
        )}
      >
        <input
          ref={ref}
          type="radio"
          id={inputId}
          name={radioName}
          value={value}
          checked={isChecked}
          onChange={handleInputChange}
          disabled={isDisabled}
          required={required}
          className="sr-only"
          {...props}
        />
        {indicator}
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">
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
