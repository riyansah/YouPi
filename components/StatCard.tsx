import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "teal" | "blue" | "amber" | "rose" | "slate";
}

const tones = {
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-100",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-100",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-100",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
};

export function StatCard({ title, value, description, href, icon: Icon, tone = "slate" }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
        </div>
        {Icon ? (
          <div className={`flex h-11 w-11 items-center justify-center rounded ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {description ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
    </>
  );

  const className =
    "block rounded border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/80";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
