import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { getIconToneClassName, getInteractiveSurfaceClassName } from "@/lib/ui-state-styles";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "teal" | "blue" | "amber" | "rose" | "slate";
}

const tones = {
  teal: "teal",
  blue: "blue",
  amber: "amber",
  rose: "rose",
  slate: "slate"
} as const;

export function StatCard({ title, value, description, href, icon: Icon, tone = "slate" }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 sm:mt-2 sm:text-3xl">{value}</p>
        </div>
        {Icon ? (
          <div className={getIconToneClassName(tones[tone]) + " h-9 w-9 rounded-xl border border-white/70 dark:border-white/10 sm:h-11 sm:w-11"}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        ) : null}
      </div>
      {description ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
    </>
  );

  const className = getInteractiveSurfaceClassName() + " block p-4 focus:outline-none focus:ring-2 focus:ring-teal-500 sm:p-5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
