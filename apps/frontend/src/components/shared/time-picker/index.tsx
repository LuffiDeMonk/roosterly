import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shared/button";
import { Dropdown } from "@/components/shared/dropdown";
import { Label } from "@/components/shared/label";

export interface TimePickerProps {
  /** Controlled time string (e.g. "14:30:00" or "02:30 PM") */
  value?: string | null;
  /** Initial time string when uncontrolled */
  defaultValue?: string | null;
  /** Callback fired when selected time changes */
  onChange?: (time: string | null) => void;
  /** Time format pattern (e.g. HH:mm:ss, hh:mm:ss A, HH:mm) */
  format?: string;
  /** Enable 12-hour format with AM/PM column selector */
  use12Hours?: boolean;
  /** Whether to show the seconds column */
  showSecond?: boolean;
  /** Step interval for hours column */
  hourStep?: number;
  /** Step interval for minutes column */
  minuteStep?: number;
  /** Step interval for seconds column */
  secondStep?: number;
  /** Function returning an array of disabled hour numbers */
  disabledHours?: () => number[];
  /** Function returning an array of disabled minute numbers given the selected hour */
  disabledMinutes?: (selectedHour: number) => number[];
  /** Function returning an array of disabled second numbers given selected hour and minute */
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
  /** Placeholder text for the trigger input */
  placeholder?: string;
  /** Label text displayed above the control */
  label?: string;
  /** Validation error message displayed below the input */
  error?: string;
  /** Helper subtext displayed below the input */
  helperText?: string;
  /** Whether the time picker is disabled */
  disabled?: boolean;
  /** Whether to show the clear button when a time is selected */
  allowClear?: boolean;
  /** Additional CSS classes for the trigger button */
  className?: string;
  /** Label for the confirm button */
  confirmText?: string;
  /** Whether to show the "Now" quick select button in the header */
  showNow?: boolean;
}

interface ParsedTime {
  hour: number;
  minute: number;
  second: number;
  ampm: "AM" | "PM";
}

function parseTimeString(
  str: string | null | undefined,
  use12Hours: boolean
): ParsedTime | null {
  if (!str) return null;
  const trimmed = str.trim();

  const match12 = trimmed.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/i
  );
  if (match12) {
    let hour = parseInt(match12[1] ?? "0", 10);
    const minute = parseInt(match12[2] ?? "0", 10);
    const second = match12[3] ? parseInt(match12[3], 10) : 0;
    let ampm: "AM" | "PM" = match12[4]?.toUpperCase() === "PM" ? "PM" : "AM";

    if (use12Hours) {
      if (hour > 12) {
        hour = hour % 12 || 12;
        ampm = "PM";
      } else if (hour === 0) {
        hour = 12;
      }
    }

    return { hour, minute, second, ampm };
  }

  return null;
}

function formatTimeString(
  time: ParsedTime | null,
  format: string,
  use12Hours: boolean
): string {
  if (!time) return "";
  const pad = (n: number) => String(n).padStart(2, "0");

  let h24 = time.hour;
  let h12 = time.hour;

  if (use12Hours) {
    if (time.ampm === "PM" && time.hour < 12) h24 = time.hour + 12;
    if (time.ampm === "AM" && time.hour === 12) h24 = 0;
  } else {
    h12 = h24 % 12 || 12;
  }

  return format
    .replace(/HH/g, pad(h24))
    .replace(/\bH\b/g, String(h24))
    .replace(/hh/g, pad(h12))
    .replace(/\bh\b/g, String(h12))
    .replace(/mm/g, pad(time.minute))
    .replace(/\bm\b/g, String(time.minute))
    .replace(/ss/g, pad(time.second))
    .replace(/\bs\b/g, String(time.second))
    .replace(/A/g, time.ampm)
    .replace(/a/g, time.ampm.toLowerCase());
}

const ITEM_HEIGHT = 40;
const CONTAINER_HEIGHT = 192;
const PADDING_Y = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

interface WheelColumnProps<T extends number | string> {
  items: Array<{ value: T; label: string; disabled?: boolean }>;
  selectedValue: T;
  onSelect: (val: T) => void;
  testId?: string;
  ariaLabel?: string;
}

function WheelColumn<T extends number | string>({
  items,
  selectedValue,
  onSelect,
  testId,
  ariaLabel,
}: WheelColumnProps<T>) {
  const colRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = useMemo(() => {
    const idx = items.findIndex((item) => item.value === selectedValue);
    return idx >= 0 ? idx : 0;
  }, [items, selectedValue]);

  const [currentIndex, setCurrentIndex] = useState<number>(selectedIndex);

  const scrollToSelected = useCallback(
    (index: number, smooth = false) => {
      if (!colRef.current) return;
      isProgrammaticScroll.current = true;
      colRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: smooth ? "smooth" : "auto",
      });
      setCurrentIndex(index);
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 150);
    },
    []
  );

  useEffect(() => {
    scrollToSelected(selectedIndex, false);
  }, [selectedIndex, scrollToSelected]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const rawIdx = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(items.length - 1, rawIdx));

    if (clampedIdx !== currentIndex) {
      setCurrentIndex(clampedIdx);
    }

    if (scrollDebounceTimer.current) {
      clearTimeout(scrollDebounceTimer.current);
    }

    scrollDebounceTimer.current = setTimeout(() => {
      if (isProgrammaticScroll.current) return;
      const finalItem = items[clampedIdx];
      if (
        finalItem &&
        !finalItem.disabled &&
        finalItem.value !== selectedValue
      ) {
        onSelect(finalItem.value);
      }
    }, 120);
  };

  const handleItemClick = (idx: number, val: T, disabled?: boolean) => {
    if (disabled) return;
    onSelect(val);
    scrollToSelected(idx, true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.min(items.length - 1, currentIndex + 1);
      const nextItem = items[nextIdx];
      if (nextItem && !nextItem.disabled) {
        handleItemClick(nextIdx, nextItem.value);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = Math.max(0, currentIndex - 1);
      const prevItem = items[prevIdx];
      if (prevItem && !prevItem.disabled) {
        handleItemClick(prevIdx, prevItem.value);
      }
    }
  };

  return (
    <div
      ref={colRef}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid={testId}
      aria-label={ariaLabel}
      className={cn(
        "relative flex-1 h-48 overflow-y-scroll overscroll-contain select-none outline-none",
        "snap-y snap-mandatory scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "focus-visible:outline-none"
      )}
      style={{
        paddingTop: `${PADDING_Y}px`,
        paddingBottom: `${PADDING_Y}px`,
      }}
    >
      {items.map((item, idx) => {
        const isSelected = item.value === selectedValue;
        const distance = Math.abs(idx - currentIndex);
        const isDisabled = item.disabled;

        let typographyClass =
          "text-sm font-normal text-muted-foreground opacity-25 scale-90";
        if (distance === 0) {
          typographyClass =
            "text-xl font-medium text-foreground opacity-100 scale-100";
        } else if (distance === 1) {
          typographyClass =
            "text-base font-normal text-muted-foreground opacity-60 scale-95";
        } else if (distance === 2) {
          typographyClass =
            "text-sm font-light text-muted-foreground opacity-30 scale-90";
        }

        return (
          <button
            key={String(item.value)}
            type="button"
            data-active={isSelected}
            disabled={isDisabled}
            onClick={() => handleItemClick(idx, item.value, isDisabled)}
            className={cn(
              "h-10 w-full snap-center flex items-center justify-center transition-all duration-150 cursor-pointer block",
              typographyClass,
              isDisabled && "opacity-15 cursor-not-allowed hover:bg-transparent text-muted-foreground"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TimePicker({
  value: controlledValue,
  defaultValue = null,
  onChange,
  use12Hours = true,
  showSecond = false,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  disabledHours,
  disabledMinutes,
  disabledSeconds,
  placeholder = "Select time",
  label,
  error,
  helperText,
  disabled = false,
  allowClear = true,
  className,
  format: customFormat,
  confirmText = "Confirm",
  showNow = true,
}: TimePickerProps) {
  const format = useMemo(() => {
    if (customFormat) return customFormat;
    const shouldShowSec = showSecond !== undefined ? showSecond : false;
    if (use12Hours) {
      return shouldShowSec ? "hh:mm:ss A" : "hh:mm A";
    }
    return shouldShowSec ? "HH:mm:ss" : "HH:mm";
  }, [customFormat, use12Hours, showSecond]);

  const hasSeconds = format.includes("s");

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const [open, setOpen] = useState(false);

  const activeValueStr =
    controlledValue !== undefined ? controlledValue : internalValue;

  const parsedTime = useMemo(() => {
    return parseTimeString(activeValueStr, use12Hours);
  }, [activeValueStr, use12Hours]);

  const [selectedHour, setSelectedHour] = useState<number>(
    parsedTime?.hour ?? (use12Hours ? 12 : 0)
  );
  const [selectedMinute, setSelectedMinute] = useState<number>(
    parsedTime?.minute ?? 0
  );
  const [selectedSecond, setSelectedSecond] = useState<number>(
    parsedTime?.second ?? 0
  );
  const [selectedAmpm, setSelectedAmpm] = useState<"AM" | "PM">(
    parsedTime?.ampm ?? "AM"
  );

  useEffect(() => {
    if (parsedTime) {
      setSelectedHour(parsedTime.hour);
      setSelectedMinute(parsedTime.minute);
      setSelectedSecond(parsedTime.second);
      setSelectedAmpm(parsedTime.ampm);
    }
  }, [parsedTime, open]);

  const commitTime = (h: number, m: number, s: number, ampm: "AM" | "PM") => {
    const formatted = formatTimeString(
      { hour: h, minute: m, second: s, ampm },
      format,
      use12Hours
    );
    if (controlledValue === undefined) {
      setInternalValue(formatted);
    }
    onChange?.(formatted);
  };

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    commitTime(h, selectedMinute, selectedSecond, selectedAmpm);
  };

  const handleMinuteSelect = (m: number) => {
    setSelectedMinute(m);
    commitTime(selectedHour, m, selectedSecond, selectedAmpm);
  };

  const handleSecondSelect = (s: number) => {
    setSelectedSecond(s);
    commitTime(selectedHour, selectedMinute, s, selectedAmpm);
  };

  const handleAmpmSelect = (ampm: "AM" | "PM") => {
    setSelectedAmpm(ampm);
    commitTime(selectedHour, selectedMinute, selectedSecond, ampm);
  };

  const handleNowClick = () => {
    const now = new Date();
    const h24 = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const h = use12Hours ? h24 % 12 || 12 : h24;

    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedSecond(s);
    setSelectedAmpm(ampm);
    commitTime(h, m, s, ampm);
  };

  const handleConfirmClick = () => {
    commitTime(selectedHour, selectedMinute, selectedSecond, selectedAmpm);
    setOpen(false);
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    if (controlledValue === undefined) {
      setInternalValue(null);
    }
    onChange?.(null);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  const disabledH = disabledHours ? disabledHours() : [];
  const disabledM = disabledMinutes ? disabledMinutes(selectedHour) : [];
  const disabledS = disabledSeconds
    ? disabledSeconds(selectedHour, selectedMinute)
    : [];

  const hourItems = useMemo(() => {
    const list: Array<{ value: number; label: string; disabled?: boolean }> = [];
    const maxHour = use12Hours ? 12 : 23;
    const startHour = use12Hours ? 1 : 0;
    for (let h = startHour; h <= maxHour; h += hourStep) {
      list.push({
        value: h,
        label: use12Hours ? String(h) : pad(h),
        disabled: disabledH.includes(h),
      });
    }
    return list;
  }, [use12Hours, hourStep, disabledH]);

  const minuteItems = useMemo(() => {
    const list: Array<{ value: number; label: string; disabled?: boolean }> = [];
    for (let m = 0; m < 60; m += minuteStep) {
      list.push({
        value: m,
        label: pad(m),
        disabled: disabledM.includes(m),
      });
    }
    return list;
  }, [minuteStep, disabledM]);

  const secondItems = useMemo(() => {
    const list: Array<{ value: number; label: string; disabled?: boolean }> = [];
    for (let s = 0; s < 60; s += secondStep) {
      list.push({
        value: s,
        label: pad(s),
        disabled: disabledS.includes(s),
      });
    }
    return list;
  }, [secondStep, disabledS]);

  const ampmItems = useMemo(() => {
    return [
      { value: "AM" as const, label: "AM" },
      { value: "PM" as const, label: "PM" },
    ];
  }, []);

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
        trigger={["click"]}
        placement="bottomLeft"
        disabled={disabled}
        menu={{ items: [] }}
        overlayClassName="w-auto max-w-none p-0 overflow-visible border border-border shadow-xl rounded-2xl"
        dropdownRender={() => (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex flex-col select-none bg-card rounded-2xl overflow-hidden w-72 sm:w-80 shadow-2xl"
          >
            {/* Header pill indicator */}
            <div className="flex items-center justify-center px-4 pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Wheel Columns */}
            <div className="relative flex items-center justify-center px-4 py-1 h-48">
              {/* Highlight Bar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 h-10 top-1/2 -translate-y-1/2 rounded-xl bg-muted"
              />

              {/* Gradient Masks */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-card via-card/80 to-transparent z-10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/80 to-transparent z-10"
              />

              <WheelColumn
                items={hourItems}
                selectedValue={selectedHour}
                onSelect={handleHourSelect}
                testId="timepicker-hours"
                ariaLabel="Select hour"
              />

              <WheelColumn
                items={minuteItems}
                selectedValue={selectedMinute}
                onSelect={handleMinuteSelect}
                testId="timepicker-minutes"
                ariaLabel="Select minute"
              />

              {hasSeconds && (
                <WheelColumn
                  items={secondItems}
                  selectedValue={selectedSecond}
                  onSelect={handleSecondSelect}
                  testId="timepicker-seconds"
                  ariaLabel="Select second"
                />
              )}

              {use12Hours && (
                <WheelColumn
                  items={ampmItems}
                  selectedValue={selectedAmpm}
                  onSelect={handleAmpmSelect}
                  testId="timepicker-ampm"
                  ariaLabel="Select AM or PM"
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 pt-2 bg-card border-t border-border flex flex-col gap-2">
              {showNow && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNowClick}
                  className="w-full h-9 text-xs"
                >
                  Now
                </Button>
              )}
              <Button
                type="button"
                variant="default"
                onClick={handleConfirmClick}
                className="w-full h-9 text-xs"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        )}
      >
        <button
          type="button"
          disabled={disabled}
          aria-label={label || placeholder}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-secondary px-3.5 py-2 text-sm text-left transition-all",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error && "border-destructive focus-visible:border-destructive",
            "dark:bg-card",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "truncate",
                activeValueStr
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {activeValueStr || placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {allowClear && activeValueStr && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear time"
                onClick={handleClear}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
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
}

export default TimePicker;
