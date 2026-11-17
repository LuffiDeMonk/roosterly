import { useState, type MouseEvent } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/shared/dropdown";
import { Label } from "@/components/shared/label";
import { Calendar, type DateRange } from "@/components/ui/calendar";
import { formatDate } from "@/components/shared/date-picker/date-utils";

export type DatePickerMode = "single" | "range";

export interface BaseDatePickerProps {
  /** Label text displayed above the control */
  label?: string;
  /** Validation error message displayed below the input */
  error?: string;
  /** Helper subtext displayed below the input */
  helperText?: string;
  /** Whether the date picker is disabled */
  disabled?: boolean;
  /** Whether to show the clear button when a date is selected */
  allowClear?: boolean;
  /** Additional CSS classes for the trigger button */
  className?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Custom function to determine if a specific date is disabled */
  disabledDates?: (date: Date) => boolean;
  /** Start year for the year navigation dropdown */
  fromYear?: number;
  /** End year for the year navigation dropdown */
  toYear?: number;
  /** Display date format (e.g. YYYY-MM-DD, MMMM DD, YYYY) */
  format?: string;
}

export interface SingleDatePickerProps extends BaseDatePickerProps {
  /** Single date selection mode */
  mode?: "single";
  /** Controlled selected date */
  value?: Date | null;
  /** Initial date value when uncontrolled */
  defaultValue?: Date | null;
  /** Callback fired when selected date changes */
  onChange?: (date: Date | null) => void;
  /** Placeholder text for single date picker */
  placeholder?: string;
}

export interface RangeDatePickerProps extends BaseDatePickerProps {
  /** Date range selection mode */
  mode: "range";
  /** Controlled selected date range */
  value?: DateRange | null;
  /** Initial date range when uncontrolled */
  defaultValue?: DateRange | null;
  /** Callback fired when date range changes */
  onChange?: (range: DateRange | null) => void;
  /** Placeholder text tuple or string for range picker */
  placeholder?: [string, string] | string;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

const SingleDatePicker = ({
  value: controlledValue,
  defaultValue = null,
  onChange,
  placeholder = "Select date",
  label,
  error,
  helperText,
  disabled = false,
  allowClear = true,
  className,
  minDate,
  maxDate,
  disabledDates,
  fromYear,
  toYear,
  format = "YYYY-MM-DD",
}: SingleDatePickerProps) => {
  const [internalDate, setInternalDate] = useState<Date | null>(defaultValue);
  const [open, setOpen] = useState(false);

  const selectedDate =
    controlledValue !== undefined ? controlledValue : internalDate;

  const handleSelect = (date: Date | undefined) => {
    const nextDate = date ?? null;
    if (controlledValue === undefined) {
      setInternalDate(nextDate);
    }
    onChange?.(nextDate);
    if (nextDate) {
      setOpen(false);
    }
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (controlledValue === undefined) {
      setInternalDate(null);
    }
    onChange?.(null);
  };

  const formattedDisplay = selectedDate ? formatDate(selectedDate, format) : "";

  return (
    <div className="flex w-full flex-col">
      {label && (
        <Label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </Label>
      )}

      <Dropdown
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        menu={{ items: [] }}
        dropdownRender={() => (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            fromYear={fromYear}
            toYear={toYear}
          />
        )}
      >
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-secondary px-3.5 py-2 text-sm text-left transition-all",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error && "border-destructive focus-visible:border-destructive",
            "dark:bg-card",
            className
          )}
        >
          <span
            className={cn(
              "truncate",
              formattedDisplay
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {formattedDisplay || placeholder}
          </span>

          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {allowClear && selectedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date"
                onClick={handleClear}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </span>
            )}
            <CalendarIcon className="size-4 text-muted-foreground" />
          </div>
        </button>
      </Dropdown>

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
};

const RangeDatePicker = ({
  value: controlledValue,
  defaultValue = null,
  onChange,
  placeholder = ["Start date", "End date"],
  label,
  error,
  helperText,
  disabled = false,
  allowClear = true,
  className,
  minDate,
  maxDate,
  disabledDates,
  fromYear,
  toYear,
  format = "YYYY-MM-DD",
}: RangeDatePickerProps) => {
  const [internalRange, setInternalRange] = useState<DateRange | null>(
    defaultValue
  );
  const [open, setOpen] = useState(false);

  const selectedRange =
    controlledValue !== undefined ? controlledValue : internalRange;

  const handleSelect = (range: DateRange | undefined) => {
    const nextRange = range ?? null;
    if (controlledValue === undefined) {
      setInternalRange(nextRange);
    }
    onChange?.(nextRange);
    if (nextRange?.from && nextRange?.to) {
      setOpen(false);
    }
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (controlledValue === undefined) {
      setInternalRange(null);
    }
    onChange?.(null);
  };

  const startPlaceholder = Array.isArray(placeholder)
    ? placeholder[0]
    : placeholder;
  const endPlaceholder = Array.isArray(placeholder)
    ? placeholder[1]
    : "End date";

  const formattedStart = selectedRange?.from
    ? formatDate(selectedRange.from, format)
    : "";
  const formattedEnd = selectedRange?.to
    ? formatDate(selectedRange.to, format)
    : "";

  return (
    <div className="flex w-full flex-col">
      {label && (
        <Label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </Label>
      )}

      <Dropdown
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        menu={{ items: [] }}
        dropdownRender={() => (
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            fromYear={fromYear}
            toYear={toYear}
          />
        )}
      >
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-secondary px-3.5 py-2 text-sm text-left transition-all",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error && "border-destructive focus-visible:border-destructive",
            "dark:bg-card",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <span
              className={
                formattedStart
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {formattedStart || startPlaceholder}
            </span>
            <span className="text-muted-foreground">-</span>
            <span
              className={
                formattedEnd
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {formattedEnd || endPlaceholder}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {allowClear && (selectedRange?.from || selectedRange?.to) && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date range"
                onClick={handleClear}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </span>
            )}
            <CalendarIcon className="size-4 text-muted-foreground" />
          </div>
        </button>
      </Dropdown>

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const DatePicker = (props: DatePickerProps) => {
  if (props.mode === "range") {
    return <RangeDatePicker {...props} />;
  }
  return <SingleDatePicker {...props} />;
};

export default DatePicker;
