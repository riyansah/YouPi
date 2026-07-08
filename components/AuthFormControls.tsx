"use client";

import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { getFieldMessageClassName, getFieldShellClassName } from "@/lib/field-styles";

export type ValidationItem = {
  id: string;
  label: string;
  valid: boolean;
};

export type ValidationDisplayMode = "helper" | "checklist" | "summary";

type PasswordToggleProps = {
  visible: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
};

type InputShellProps = {
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  filled?: boolean;
  error?: boolean;
  disabled?: boolean;
};

type ValidationFeedbackProps = {
  helperText: string;
  summaryText: string;
  mode: ValidationDisplayMode;
  items: ValidationItem[];
};

export function getValidationDisplayMode({
  focused,
  touched,
  value,
  valid
}: {
  focused: boolean;
  touched: boolean;
  value: string;
  valid: boolean;
}): ValidationDisplayMode {
  if (focused || value) {
    if (!focused && valid) {
      return "summary";
    }

    return "checklist";
  }

  return touched ? "checklist" : "helper";
}

export function PasswordToggle({ visible, onClick, label, disabled = false }: PasswordToggleProps) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center text-slate-600 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:text-slate-50"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function InputShell({ icon: Icon, children, action, filled = false, error = false, disabled = false }: InputShellProps) {
  return (
    <span className={getFieldShellClassName({ filled, error, disabled })}>
      <span className="flex h-10 w-10 items-center justify-center text-slate-400 dark:text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
    </span>
  );
}

export function CapsLockWarning({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <p aria-live="polite" className={getFieldMessageClassName()}>
      Caps Lock aktif.
    </p>
  );
}

export function FieldHelperText({ text }: { text: string }) {
  return <p className={getFieldMessageClassName()}>{text}</p>;
}

export function ValidationSummary({ text }: { text: string }) {
  return (
    <p aria-live="polite" className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300">
      <span aria-hidden="true" className="font-semibold">
        ✓
      </span>
      <span>{text}</span>
    </p>
  );
}

export function ValidationChecklist({ items }: { items: ValidationItem[] }) {
  return (
    <ul aria-live="polite" className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className={item.valid ? "font-semibold text-teal-700" : "font-semibold text-amber-700"}
          >
            {item.valid ? "✓" : "!"}
          </span>
          <span className={item.valid ? "text-teal-700" : "text-amber-700"}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ValidationFeedback({ helperText, summaryText, mode, items }: ValidationFeedbackProps) {
  if (mode === "summary") {
    return <ValidationSummary text={summaryText} />;
  }

  if (mode === "checklist") {
    return <ValidationChecklist items={items} />;
  }

  return <FieldHelperText text={helperText} />;
}
