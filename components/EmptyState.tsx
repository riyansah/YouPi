import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({ title, description, actionHref, actionLabel, icon: Icon = Inbox, className }: EmptyStateProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900/60", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(13,148,136,0.08),transparent_48%)]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-sm flex-col items-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-100 bg-white text-teal-700 shadow-sm dark:border-teal-900 dark:bg-slate-800 dark:text-teal-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="mt-4 inline-flex items-center rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-offset-slate-900">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
