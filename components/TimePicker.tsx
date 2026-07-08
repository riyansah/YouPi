"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, X } from "lucide-react";
import type { AppLanguage } from "@/lib/types";
import { getFieldClassName, getFieldMessageClassName } from "@/lib/field-styles";
import { getIconButtonClassName, getInteractiveSurfaceClassName } from "@/lib/ui-state-styles";
import { cn } from "@/lib/utils";

type PickerMode = "hour" | "minute";

interface TimePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  language?: AppLanguage;
  error?: string | null;
  disabled?: boolean;
}

interface TimeOption {
  label: string;
  value: number;
  position: number;
  ring: "outer" | "inner";
}

function parseTime(value: string) {
  const [rawHours, rawMinutes] = value.split(":").map(Number);
  const hours = Number.isInteger(rawHours) ? Math.min(Math.max(rawHours, 0), 23) : 0;
  const minutes = Number.isInteger(rawMinutes) ? Math.min(Math.max(rawMinutes, 0), 55) : 0;

  return {
    hours,
    minutes: Math.min(55, Math.round(minutes / 5) * 5)
  };
}

function formatTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const hourValues: TimeOption[] = [
  ...Array.from({ length: 12 }, (_, index) => {
    const label = index + 1;
    return { label: String(label), value: label, position: label, ring: "outer" as const };
  }),
  ...Array.from({ length: 12 }, (_, index) => {
    const label = index + 13;
    return { label: String(label), value: label === 24 ? 0 : label, position: label - 12, ring: "inner" as const };
  })
];
const minuteValues: TimeOption[] = Array.from({ length: 12 }, (_, index) => ({
  label: String(index * 5).padStart(2, "0"),
  value: index * 5,
  position: index,
  ring: "outer" as const
}));

function getOptionPosition(option: TimeOption) {
  const radius = option.ring === "inner" ? 58 : 92;
  const position = option.position % 12;
  const angle = (position / 12) * Math.PI * 2 - Math.PI / 2;

  return {
    left: `calc(50% + ${Math.cos(angle) * radius}px)`,
    top: `calc(50% + ${Math.sin(angle) * radius}px)`
  };
}

export function TimePicker({ id, label, value, onChange, placeholder, allowClear = false, language = "id", error = null, disabled = false }: TimePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const parsedValue = useMemo(() => parseTime(value || "00:00"), [value]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("hour");
  const [draftHours, setDraftHours] = useState(parsedValue.hours);
  const [draftMinutes, setDraftMinutes] = useState(parsedValue.minutes);

  const text = {
    placeholder: placeholder || (language === "id" ? "Pilih jam" : "Select time"),
    clear: language === "id" ? "Kosongkan" : "Clear",
    choose: language === "id" ? "Pilih" : "Choose",
    hour: language === "id" ? "Jam" : "Hour",
    minute: language === "id" ? "Menit" : "Minute",
    close: language === "id" ? "Tutup pemilih waktu" : "Close time picker",
    format: language === "id" ? "Format 24 jam" : "24-hour format"
  };

  useEffect(() => {
    if (!open) {
      setDraftHours(parsedValue.hours);
      setDraftMinutes(parsedValue.minutes);
      setMode("hour");
    }
  }, [open, parsedValue.hours, parsedValue.minutes]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function commit(nextHours = draftHours, nextMinutes = draftMinutes) {
    if (disabled) {
      return;
    }

    onChange(formatTime(nextHours, nextMinutes));
  }

  function selectHour(hours: number) {
    setDraftHours(hours);
    commit(hours, draftMinutes);
    setMode("minute");
  }

  function selectMinute(minutes: number) {
    setDraftMinutes(minutes);
    commit(draftHours, minutes);
    setOpen(false);
  }

  function clearValue() {
    if (disabled) {
      return;
    }

    onChange("");
    setOpen(false);
  }

  const values = mode === "hour" ? hourValues : minuteValues;

  return (
    <div ref={wrapperRef} className="relative space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          id={id}
          type="button"
          onClick={() => {
            if (disabled) {
              return;
            }

            setOpen((current) => !current);
          }}
          className={cn(getFieldClassName({ filled: Boolean(value), error: Boolean(error), disabled }), "flex items-center justify-between gap-3 text-left")}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
        >
          <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}>{value || text.placeholder}</span>
          <Clock3 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
        </button>
        {allowClear ? (
          <button
            type="button"
            onClick={clearValue}
            className={cn(getIconButtonClassName(), disabled ? "cursor-not-allowed opacity-70" : "")}
            aria-label={`${text.clear} ${label.toLowerCase()}`}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {error ? <p className={getFieldMessageClassName("error")}>{error}</p> : null}

      {open ? (
        <div
          role="dialog"
          aria-label={`${text.choose} ${label.toLowerCase()}`}
          className={getInteractiveSurfaceClassName({ selected: true }) + " absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] p-4"}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
              {(["hour", "minute"] as PickerMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition",
                    mode === item ? "bg-teal-700 text-white dark:bg-teal-600" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  {item === "hour" ? text.hour : text.minute}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={getIconButtonClassName() + " h-8 w-8"}
              aria-label={text.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50">{formatTime(draftHours, draftMinutes)}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{text.format}</p>
          </div>

          <div className="relative mx-auto h-56 w-56 rounded-full border border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90">
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-700 dark:bg-teal-400" />
            {values.map((item) => {
              const selected = mode === "hour" ? draftHours === item.value : draftMinutes === item.value;
              const position = getOptionPosition(item);

              return (
                <button
                  key={`${mode}-${item.label}`}
                  type="button"
                  onClick={() => (mode === "hour" ? selectHour(item.value) : selectMinute(item.value))}
                  className={cn(
                    "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition",
                    selected ? "bg-teal-700 text-white shadow dark:bg-teal-500" : "text-slate-700 hover:bg-white dark:text-slate-100 dark:hover:bg-slate-700"
                  )}
                  style={position}
                  aria-label={mode === "hour" ? `${text.hour} ${item.label}` : `${text.minute} ${item.label}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
