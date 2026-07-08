import { cn } from "@/lib/utils";

type FieldStateOptions = {
  filled?: boolean;
  error?: boolean;
  disabled?: boolean;
};

export function getFieldClassName({ filled = false, error = false, disabled = false }: FieldStateOptions = {}) {
  return cn(
    "w-full rounded border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-offset-slate-950",
    error
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500 dark:bg-rose-950/20 dark:focus:ring-rose-950/80"
      : "border-slate-300 focus:border-teal-500 focus:ring-teal-200 dark:border-slate-600 dark:focus:border-teal-400 dark:focus:ring-teal-950/90",
    filled && !error ? "bg-slate-50 dark:border-slate-500 dark:bg-slate-900" : "",
    disabled
      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 placeholder:text-slate-400 opacity-75 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500 dark:placeholder:text-slate-600"
      : "dark:hover:border-slate-500"
  );
}

export function getFieldShellClassName({ filled = false, error = false, disabled = false }: FieldStateOptions = {}) {
  return cn(
    "flex items-center rounded border bg-white transition dark:bg-slate-950",
    error
      ? "border-rose-500 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 dark:border-rose-500 dark:bg-rose-950/20 dark:focus-within:ring-rose-950/80"
      : "border-slate-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200 dark:border-slate-600 dark:focus-within:border-teal-400 dark:focus-within:ring-teal-950/90",
    filled && !error ? "bg-slate-50 dark:border-slate-500 dark:bg-slate-900" : "",
    disabled ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-75 dark:border-slate-800 dark:bg-slate-900/70" : "dark:hover:border-slate-500"
  );
}

export function getFieldMessageClassName(tone: "neutral" | "error" = "neutral") {
  return tone === "error" ? "text-xs text-rose-700 dark:text-rose-300" : "text-xs text-slate-500 dark:text-slate-400";
}
