"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  presets?: { label: string; range: DateRange }[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Default presets for assessment use cases
const DEFAULT_PRESETS = [
  {
    label: "Last 30 days",
    range: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
  },
  {
    label: "Last 90 days",
    range: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
  },
  {
    label: "This year",
    range: {
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    },
  },
  {
    label: "Last year",
    range: {
      from: new Date(new Date().getFullYear() - 1, 0, 1),
      to: new Date(new Date().getFullYear() - 1, 11, 31),
    },
  },
  {
    label: "Tax Year 2024",
    range: {
      from: new Date(2024, 0, 1),
      to: new Date(2024, 11, 31),
    },
  },
  {
    label: "Tax Year 2025",
    range: {
      from: new Date(2025, 0, 1),
      to: new Date(2025, 11, 31),
    },
  },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className,
  minDate,
  maxDate,
  presets = DEFAULT_PRESETS,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const [internalRange, setInternalRange] = useState<DateRange>({
    from: value?.from ?? null,
    to: value?.to ?? null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with external value
  useEffect(() => {
    if (value) {
      setInternalRange(value);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const handleDateClick = (date: Date) => {
    if (selecting === "from") {
      setInternalRange({ from: date, to: null });
      setSelecting("to");
    } else {
      if (internalRange.from && date < internalRange.from) {
        // If "to" is before "from", swap them
        setInternalRange({ from: date, to: internalRange.from });
      } else {
        setInternalRange({ ...internalRange, to: date });
      }
      setSelecting("from");
    }
  };

  const applyRange = () => {
    if (onChange && internalRange.from) {
      onChange(internalRange);
    }
    setOpen(false);
  };

  const clearRange = () => {
    setInternalRange({ from: null, to: null });
    if (onChange) {
      onChange({ from: null, to: null });
    }
  };

  const applyPreset = (preset: { label: string; range: DateRange }) => {
    setInternalRange(preset.range);
    if (onChange) {
      onChange(preset.range);
    }
    setOpen(false);
  };

  const isDateInRange = (date: Date) => {
    if (!internalRange.from || !internalRange.to) return false;
    return date >= internalRange.from && date <= internalRange.to;
  };

  const isDateSelected = (date: Date) => {
    const fromMatch = internalRange.from && 
      date.toDateString() === internalRange.from.toDateString();
    const toMatch = internalRange.to && 
      date.toDateString() === internalRange.to.toDateString();
    return fromMatch || toMatch;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayValue = () => {
    if (internalRange.from && internalRange.to) {
      return `${formatDate(internalRange.from)} - ${formatDate(internalRange.to)}`;
    }
    if (internalRange.from) {
      return `${formatDate(internalRange.from)} - ...`;
    }
    return "";
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors",
          "hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
          open && "border-primary ring-1 ring-primary"
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className={cn("flex-1 text-left", !displayValue() && "text-muted-foreground")}>
          {displayValue() || placeholder}
        </span>
        {displayValue() && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearRange();
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex rounded-lg border border-border bg-card shadow-xl animate-slide-in">
          {/* Presets */}
          <div className="border-r border-border p-2">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Select
            </p>
            <div className="flex flex-col gap-0.5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="rounded-md px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-foreground">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Selection indicator */}
            <div className="mb-2 flex items-center gap-2 text-[10px]">
              <span className={cn("rounded px-2 py-0.5", selecting === "from" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>
                From: {formatDate(internalRange.from) || "—"}
              </span>
              <span className={cn("rounded px-2 py-0.5", selecting === "to" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>
                To: {formatDate(internalRange.to) || "—"}
              </span>
            </div>

            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                const isDisabled = isDateDisabled(date);
                const isSelected = isDateSelected(date);
                const isInRange = isDateInRange(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={i}
                    onClick={() => !isDisabled && handleDateClick(date)}
                    disabled={isDisabled}
                    className={cn(
                      "h-7 w-7 rounded text-xs transition-colors",
                      isDisabled && "cursor-not-allowed text-muted-foreground/30",
                      !isDisabled && !isSelected && !isInRange && "text-foreground hover:bg-accent",
                      isInRange && !isSelected && "bg-primary/10 text-primary",
                      isSelected && "bg-primary text-primary-foreground",
                      isToday && !isSelected && "ring-1 ring-primary"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <button
                onClick={clearRange}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <button
                onClick={applyRange}
                disabled={!internalRange.from}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
