import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/shared/select";
import {
  DAY_NAMES,
  MONTH_NAMES,
  generateCalendarDays,
  isDateInRange,
  isSameDay,
  isBeforeDay,
  isAfterDay,
} from "@/components/shared/date-picker/date-utils";

export type CalendarMode = "single" | "range";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface BaseCalendarProps {
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (date: Date) => boolean;
  fromYear?: number;
  toYear?: number;
  showOutsideDays?: boolean;
}

export interface SingleCalendarProps extends BaseCalendarProps {
  mode?: "single";
  selected?: Date | null;
  onSelect?: (date: Date | undefined) => void;
}

export interface RangeCalendarProps extends BaseCalendarProps {
  mode: "range";
  selected?: DateRange | null;
  onSelect?: (range: DateRange | undefined) => void;
}

export type CalendarProps = SingleCalendarProps | RangeCalendarProps;

export function Calendar(props: CalendarProps) {
  const {
    className,
    minDate,
    maxDate,
    disabledDates,
    fromYear = 1970,
    toYear = new Date().getFullYear() + 30,
    showOutsideDays = true,
  } = props;

  const initialDate = useMemo(() => {
    if (props.mode === "range" && props.selected?.from) {
      return props.selected.from;
    }
    if (props.mode !== "range" && props.selected) {
      return props.selected;
    }
    return new Date();
  }, [props]);

  const [currentYear, setCurrentYear] = useState<number>(
    initialDate.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    initialDate.getMonth()
  );
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  useEffect(() => {
    if (props.mode === "single" && props.selected) {
      setCurrentYear(props.selected.getFullYear());
      setCurrentMonth(props.selected.getMonth());
    } else if (props.mode === "range" && props.selected?.from) {
      setCurrentYear(props.selected.from.getFullYear());
      setCurrentMonth(props.selected.from.getMonth());
    }
  }, [props.selected, props.mode]);

  const yearOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [];
    for (let y = fromYear; y <= toYear; y++) {
      options.push({ label: String(y), value: String(y) });
    }
    return options;
  }, [fromYear, toYear]);

  const monthOptions: SelectOption[] = useMemo(() => {
    return MONTH_NAMES.map((name, index) => ({
      label: name,
      value: String(index),
    }));
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isDayDisabled = (date: Date): boolean => {
    if (minDate && isBeforeDay(date, minDate)) return true;
    if (maxDate && isAfterDay(date, maxDate)) return true;
    if (disabledDates && disabledDates(date)) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDayDisabled(date)) return;

    if (props.mode === "range") {
      const { selected, onSelect } = props;
      if (!selected?.from || (selected.from && selected.to)) {
        onSelect?.({ from: date, to: undefined });
      } else {
        if (isBeforeDay(date, selected.from)) {
          onSelect?.({ from: date, to: selected.from });
        } else {
          onSelect?.({ from: selected.from, to: date });
        }
      }
    } else {
      const { selected, onSelect } = props;
      if (selected && isSameDay(selected, date)) {
        onSelect?.(undefined);
      } else {
        onSelect?.(date);
      }
    }
  };

  const days = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  return (
    <div
      data-slot="calendar"
      className={cn(
        "p-4 bg-card text-foreground select-none w-[320px] max-w-full rounded-2xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={handlePrevMonth}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1.5 flex-1 justify-center">
          <div className="w-28 shrink-0">
            <Select
              mode="single"
              options={monthOptions}
              value={String(currentMonth)}
              onValueChange={(val) => {
                if (val !== null) setCurrentMonth(Number(val));
              }}
              placeholder="Month"
              className="h-8 min-h-8 px-2 py-1 text-xs font-medium"
            />
          </div>
          <div className="w-20 shrink-0">
            <Select
              mode="single"
              options={yearOptions}
              value={String(currentYear)}
              onValueChange={(val) => {
                if (val !== null) setCurrentYear(Number(val));
              }}
              placeholder="Year"
              className="h-8 min-h-8 px-2 py-1 text-xs font-medium"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={handleNextMonth}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-xs font-semibold text-muted-foreground py-1 h-7 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div
        className="grid grid-cols-7 gap-y-1"
        onMouseLeave={() => setHoveredDate(null)}
      >
        {days.map((item, index) => {
          const { date, isCurrentMonth, isToday } = item;
          const disabled = isDayDisabled(date);

          if (!isCurrentMonth && !showOutsideDays) {
            return <div key={index} className="h-8 w-8" />;
          }

          let isSelected = false;
          let isRangeStart = false;
          let isRangeEnd = false;
          let isInRange = false;

          if (props.mode === "range") {
            const { from, to } = props.selected || {};
            isRangeStart = !!from && isSameDay(date, from);
            isRangeEnd = !!to && isSameDay(date, to);

            if (from && to) {
              isInRange = isDateInRange(date, from, to);
            } else if (from && !to && hoveredDate) {
              isInRange = isDateInRange(date, from, hoveredDate);
              if (isSameDay(date, hoveredDate) && !isSameDay(date, from)) {
                if (isBeforeDay(hoveredDate, from)) {
                  isRangeStart = true;
                } else {
                  isRangeEnd = true;
                }
              }
            }
            isSelected = isRangeStart || isRangeEnd;
          } else {
            isSelected = !!props.selected && isSameDay(date, props.selected);
          }

          return (
            <div
              key={index}
              className={cn(
                "relative flex items-center justify-center p-0",
                isInRange && "bg-primary/10",
                isRangeStart && "rounded-l-lg bg-primary/10",
                isRangeEnd && "rounded-r-lg bg-primary/10",
                isSelected && !isInRange && "bg-transparent"
              )}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(date)}
                className={cn(
                  "h-8 w-8 text-xs font-medium transition-colors flex items-center justify-center rounded-lg cursor-pointer",
                  !isCurrentMonth && "text-muted-foreground/40",
                  isCurrentMonth && !isSelected && !isInRange && "text-foreground hover:bg-muted",
                  isToday && !isSelected && "border border-primary font-bold text-primary",
                  isInRange && !isSelected && "text-foreground rounded-none",
                  isSelected && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-xs",
                  disabled && "opacity-30 cursor-not-allowed hover:bg-transparent text-muted-foreground"
                )}
                aria-label={date.toDateString()}
                aria-selected={isSelected || isInRange}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
