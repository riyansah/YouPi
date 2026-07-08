import { CurrentDateTime } from "@/components/CurrentDateTime";
import type { AppLanguage } from "@/lib/types";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  language?: AppLanguage;
  timeZone?: string;
}

export function PageHeader({ eyebrow, title, description, language = "en", timeZone }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <CurrentDateTime className="self-start sm:self-auto" language={language} timeZone={timeZone} />
    </div>
  );
}
