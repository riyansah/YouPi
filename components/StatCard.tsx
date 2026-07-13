import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getIconToneClassName, getInteractiveSurfaceClassName } from "@/lib/ui-state-styles";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "teal" | "blue" | "amber" | "rose" | "slate";
}

const tones = {
  teal: { icon: "teal", accent: "bg-teal-500", glow: "bg-teal-400/10" },
  blue: { icon: "blue", accent: "bg-blue-500", glow: "bg-blue-400/10" },
  amber: { icon: "amber", accent: "bg-amber-500", glow: "bg-amber-400/10" },
  rose: { icon: "rose", accent: "bg-rose-500", glow: "bg-rose-400/10" },
  slate: { icon: "slate", accent: "bg-slate-400", glow: "bg-slate-400/10" }
} as const;

export function StatCard({ title, value, description, href, icon: Icon, tone = "slate" }: StatCardProps) {
  const palette = tones[tone];
  const content = (
    <>
      <span className={cn("absolute inset-x-0 top-0 h-1", palette.accent)} aria-hidden="true" />
      <span className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl", palette.glow)} aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 sm:text-sm sm:normal-case sm:tracking-normal">{title}</p>
          <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">{value}</p>
        </div>
        {Icon ? (
          <div className={getIconToneClassName(palette.icon) + " relative h-9 w-9 border border-white/70 shadow-sm dark:border-white/10 sm:h-11 sm:w-11"}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        ) : null}
      </div>
      {description ? <p className="relative mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
      {href ? <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 transition group-hover:text-teal-600 dark:text-slate-600 dark:group-hover:text-teal-300" aria-hidden="true" /> : null}
    </>
  );

  const className = getInteractiveSurfaceClassName() + " group relative block overflow-hidden p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 sm:p-5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
