"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock3, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PickerMode = "hour" | "minute";
type Period = "AM" | "PM";

interface TimePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}

function parseTime(value: string) {
  const [rawHours, rawMinutes] = value.split(":").map(Number);
  const hours = Number.isInteger(rawHours) ? Math.min(Math.max(rawHours, 0), 23) : 0;
  const minutes = Number.isInteger(rawMinutes) ? Math.min(Math.max(rawMinutes, 0), 55) : 0;

  return {
    hours,
    minutes: Math.round(minutes / 5) * 5
  };
}

function formatTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getPeriod(hours: number): Period {
  return hours >= 12 ? "PM" : "AM";
}

function toFaceHour(hours: number) {
  const value = hours % 12;
  return value === 0 ? 12 : value;
}

function toTwentyFourHour(faceHour: number, period: Period) {
  if (period === "AM") {
    return faceHour === 12 ? 0 : faceHour;
  }

  return faceHour === 12 ? 12 : faceHour + 12;
}

const hourValues = Array.from({ length: 12 }, (_, index) => index + 1);
const minuteValues = Array.from({ length: 12 }, (_, index) => index * 5);

export function TimePicker({ id, label, value, onChange, placeholder = "Pilih jam", allowClear = false }: TimePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const parsedValue = useMemo(() => parseTime(value || "00:00"), [value]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("hour");
  const [draftHours, setDraftHours] = useState(parsedValue.hours);
  const [draftMinutes, setDraftMinutes] = useState(parsedValue.minutes);
  const period = getPeriod(draftHours);
  const selectedFaceHour = toFaceHour(draftHours);

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
    onChange(formatTime(nextHours, nextMinutes));
  }

  function selectHour(faceHour: number) {
    const nextHours = toTwentyFourHour(faceHour, period);
    setDraftHours(nextHours);
    commit(nextHours, draftMinutes);
    setMode("minute");
  }

  function selectMinute(minutes: number) {
    setDraftMinutes(minutes);
    commit(draftHours, minutes);
    setOpen(false);
  }

  function selectPeriod(nextPeriod: Period) {
    const nextHours = toTwentyFourHour(selectedFaceHour, nextPeriod);
    setDraftHours(nextHours);
    commit(nextHours, draftMinutes);
  }

  function clearValue() {
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
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 rounded border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}>{value || placeholder}</span>
          <Clock3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </button>
        {allowClear ? (
          <button
            type="button"
            onClick={clearValue}
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={`Kosongkan ${label.toLowerCase()}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-label={`Pilih ${label.toLowerCase()}`}
          className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="inline-flex rounded border border-slate-200 p-1 dark:border-slate-700">
              {(["hour", "minute"] as PickerMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "rounded px-3 py-1 text-xs font-semibold",
                    mode === item ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  {item === "hour" ? "Jam" : "Menit"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Tutup pilihan jam"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50">{formatTime(draftHours, draftMinutes)}</p>
            <div className="inline-flex rounded border border-slate-200 p-1 dark:border-slate-700">
              {(["AM", "PM"] as Period[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectPeriod(item)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-semibold",
                    period === item ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-56 w-56 rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-700" />
            {values.map((item) => {
              const angle = mode === "hour" ? (item % 12) * 30 - 90 : item * 6 - 90;
              const radius = 88;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              const active = mode === "hour" ? item === selectedFaceHour : item === draftMinutes;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => (mode === "hour" ? selectHour(item) : selectMinute(item))}
                  className={cn(
                    "absolute left-1/2 top-1/2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition",
                    active
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-teal-950 dark:hover:text-teal-100"
                  )}
                  style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                >
                  {mode === "hour" ? item : String(item).padStart(2, "0")}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            {allowClear ? (
              <button
                type="button"
                onClick={clearValue}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Kosongkan
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Check className="h-4 w-4" />
              Selesai
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
