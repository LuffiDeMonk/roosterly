import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Badge } from "@/components/shared/badge";
import { Label } from "@/components/shared/label";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type SelectValue = string | null;

export interface BaseSelectProps {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  error?: string;
  helperText?: string;
  listMaxHeight?: string;
}

export interface SingleSelectProps extends BaseSelectProps {
  mode?: "single";
  value: SelectValue;
  onValueChange: (value: SelectValue) => void;
  maxSelected?: never;
  variant?: "default" | "long-list";
}

export interface MultiSelectProps extends BaseSelectProps {
  mode: "multiple";
  value: string[];
  onValueChange: (value: string[]) => void;
  maxSelected?: number;
  maxHeight?: string;
  scrollDirection?: "vertical" | "horizontal";
  variant?: "default" | "horizontal" | "vertical" | "long-list";
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

const SingleSelect = ({
  options,
  value,
  onValueChange,
  placeholder = "Select option",
  label,
  disabled,
  className,
  searchable = false,
  error,
  helperText,
  listMaxHeight,
  variant = "default",
}: SingleSelectProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const comboboxValue = value ?? "";

  const filteredOptions =
    searchable && searchQuery
      ? options.filter((o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

  return (
    <div className="flex w-full flex-col">
      {label && (
        <Label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      <Combobox
        value={comboboxValue}
        onValueChange={(v) => onValueChange(v === "" ? null : (v as string))}
        items={filteredOptions}
        filter={null}
      >
        <ComboboxTrigger
          className={cn(
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            className
          )}
          disabled={disabled}
        >
          <ComboboxValue placeholder={placeholder}>
            {(val: any) => {
              const targetVal =
                val !== undefined && val !== null && val !== "" ? val : value;
              const opt = options.find(
                (o) => String(o.value) === String(targetVal)
              );
              if (!opt) {
                return (
                  <span className="truncate font-normal text-muted-foreground">
                    {placeholder}
                  </span>
                );
              }
              return (
                <span className="truncate font-medium text-foreground">
                  {opt.label}
                </span>
              );
            }}
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent>
          {searchable && (
            <ComboboxInput
              placeholder={placeholder}
              showTrigger={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-1"
            />
          )}
          <ComboboxList
            className={cn(
              "overflow-y-auto no-scrollbar",
              listMaxHeight || (variant === "long-list" ? "max-h-80" : "max-h-60")
            )}
          >
            <ComboboxEmpty>No options found</ComboboxEmpty>
            {filteredOptions.map((opt) => (
              <ComboboxItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
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

const MultiSelect = ({
  options,
  value,
  onValueChange,
  placeholder = "Select options",
  label,
  disabled,
  className,
  maxSelected,
  maxHeight,
  scrollDirection = "vertical",
  variant = "default",
  error,
  helperText,
  listMaxHeight,
}: MultiSelectProps) => {
  const isHorizontal =
    scrollDirection === "horizontal" || variant === "horizontal";
  const isLongList = variant === "long-list";
  const anchorRef = useComboboxAnchor();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const availableOptions = useMemo(() => {
    return options
      .filter((opt) => !value.includes(opt.value))
      .filter((opt) =>
        searchQuery.trim()
          ? opt.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
          : true
      );
  }, [options, value, searchQuery]);

  // Auto-scroll to end of chips container when new options are selected
  useEffect(() => {
    if (scrollContainerRef.current) {
      if (isHorizontal) {
        scrollContainerRef.current.scrollLeft =
          scrollContainerRef.current.scrollWidth;
      } else {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    }
  }, [value.length, isHorizontal]);

  // Handle native non-passive wheel events for smooth horizontal scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isHorizontal) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 0) {
          if (
            (e.deltaY > 0 && container.scrollLeft < maxScroll) ||
            (e.deltaY < 0 && container.scrollLeft > 0)
          ) {
            e.preventDefault();
            e.stopPropagation();
            container.scrollLeft += e.deltaY;
          }
        }
      }
    };

    container.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelNative);
    };
  }, [isHorizontal]);

  const handleRemove = (val: string) => {
    onValueChange(value.filter((v) => v !== val));
  };

  const handleClearAll = () => {
    onValueChange([]);
    setSearchQuery("");
  };

  const handleValueChange = (newVal: string[]) => {
    if (maxSelected && newVal.length > maxSelected) return;
    onValueChange(newVal);
    setSearchQuery("");
  };

  return (
    <div className="flex w-full flex-col">
      {label && (
        <Label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      <Combobox
        multiple
        modal={false}
        value={value}
        onValueChange={handleValueChange}
        inputValue={searchQuery}
        onInputValueChange={(val) => setSearchQuery(val)}
        onOpenChange={(open) => {
          if (!open) setSearchQuery("");
        }}
        items={availableOptions.map((opt) => opt.value)}
      >
        <ComboboxChips
          ref={anchorRef}
          className={cn(
            "min-h-11 cursor-text transition-all",
            error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
            isHorizontal && "h-11 py-1 overflow-hidden",
            className
          )}
        >
          <div
            ref={scrollContainerRef}
            data-slot="selected-options"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest("button")) {
                const input = scrollContainerRef.current?.querySelector("input");
                input?.focus();
              }
            }}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1.5 overscroll-contain no-scrollbar",
              isHorizontal
                ? "flex-nowrap overflow-x-auto overflow-y-hidden py-0.5"
                : cn(
                    "flex-wrap overflow-y-auto pr-1.5",
                    maxHeight || (isLongList ? "max-h-32" : "max-h-20")
                  )
            )}
          >
            {selectedOptions.map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className={cn(
                  "gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground",
                  isHorizontal && "shrink-0 max-w-44 whitespace-nowrap"
                )}
              >
                <span className="truncate">{opt.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${opt.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(opt.value);
                  }}
                  className="ml-0.5 rounded-full opacity-60 hover:opacity-100 focus:outline-none shrink-0"
                  disabled={disabled}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <ComboboxChipsInput
              placeholder={selectedOptions.length === 0 ? placeholder : ""}
              disabled={disabled}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                isHorizontal
                  ? selectedOptions.length === 0
                    ? "w-full min-w-0"
                    : "shrink-0 min-w-20"
                  : ""
              )}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {selectedOptions.length > 0 && (
              <button
                type="button"
                aria-label="Clear all selections"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="rounded-full p-1 opacity-50 hover:opacity-100 focus:outline-none"
                disabled={disabled}
              >
                <X className="size-3.5" />
              </button>
            )}
            <ChevronDown className="pointer-events-none size-4 text-muted-foreground" />
          </div>
        </ComboboxChips>

        <ComboboxContent anchor={anchorRef}>
          <ComboboxList
            className={cn(
              "overflow-y-auto no-scrollbar",
              listMaxHeight || (isLongList ? "max-h-80" : "max-h-60")
            )}
          >
            {availableOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No options found
              </div>
            ) : (
              availableOptions.map((opt) => (
                <ComboboxItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </ComboboxItem>
              ))
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
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

export const Select = (props: SelectProps) => {
  if (props.mode === "multiple") {
    return <MultiSelect {...props} />;
  }
  return <SingleSelect {...props} />;
};

export default Select;
