import { cn } from "@/lib/utils";

export type SemanticTone = "neutral" | "info" | "success" | "warning" | "danger" | "upcoming";
export type OutlineButtonTone = "neutral" | "brand" | "danger" | "info";
export type SolidButtonTone = "brand" | "danger";
export type IconTone = "slate" | "blue" | "teal" | "amber" | "rose";

const semanticToneClasses: Record<SemanticTone, string> = {
  neutral: "border-slate-300 bg-slate-100/90 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
  info: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/70 dark:text-blue-100",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-100",
  warning: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-100",
  danger: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/70 dark:text-rose-100",
  upcoming: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950/70 dark:text-violet-100"
};

const outlineButtonTones: Record<OutlineButtonTone, string> = {
  neutral: "border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 dark:border-slate-600 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800",
  brand: "border-teal-300 text-teal-800 hover:bg-teal-50 hover:border-teal-400 dark:border-teal-600 dark:text-teal-100 dark:hover:border-teal-500 dark:hover:bg-teal-950/60",
  danger: "border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 dark:border-rose-700 dark:text-rose-100 dark:hover:border-rose-600 dark:hover:bg-rose-950/60",
  info: "border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-700 dark:text-blue-100 dark:hover:border-blue-600 dark:hover:bg-blue-950/60"
};

const solidButtonTones: Record<SolidButtonTone, string> = {
  brand: "bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500",
  danger: "bg-rose-700 text-white hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500"
};

const iconToneClasses: Record<IconTone, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-100",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-100",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-100",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-100"
};

export function getInteractiveSurfaceClassName(options?: { selected?: boolean }) {
  return cn(
    "rounded border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900",
    options?.selected
      ? "border-teal-300 bg-teal-50/80 ring-1 ring-inset ring-teal-200 dark:border-teal-600 dark:bg-teal-950/30 dark:ring-teal-700"
      : "hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800/80"
  );
}

export function getSemanticToneClassName(tone: SemanticTone) {
  return semanticToneClasses[tone];
}

export function getSemanticChipClassName(tone: SemanticTone) {
  return cn("rounded border px-2 py-1 text-xs font-semibold", semanticToneClasses[tone]);
}

export function getCountdownChipClassName(tone: SemanticTone) {
  return cn("rounded-md border px-2 py-1 text-xs font-semibold", semanticToneClasses[tone]);
}

export function getOutlineButtonClassName(tone: OutlineButtonTone = "neutral") {
  return cn(
    "inline-flex items-center rounded border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900",
    outlineButtonTones[tone]
  );
}

export function getIconButtonClassName(tone: OutlineButtonTone = "neutral") {
  return cn("inline-flex h-9 w-9 items-center justify-center rounded border transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900", outlineButtonTones[tone]);
}

export function getSolidButtonClassName(tone: SolidButtonTone = "brand") {
  return cn(
    "inline-flex items-center rounded px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-900",
    solidButtonTones[tone]
  );
}

export function getFeedbackPanelClassName(kind: "toast" | "modal" | "drawer" | "alert" | "empty" = "toast") {
  if (kind === "empty") {
    return "rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300";
  }

  if (kind === "alert") {
    return "rounded border bg-white p-4 text-sm dark:bg-slate-900";
  }

  if (kind === "drawer") {
    return "border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900";
  }

  if (kind === "modal") {
    return "rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900";
  }

  return "rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-slate-900";
}

export function getIconToneClassName(tone: IconTone = "slate") {
  return cn("flex items-center justify-center rounded", iconToneClasses[tone]);
}
