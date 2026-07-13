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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.1)]" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <CurrentDateTime className="w-full self-start sm:hidden" mobile language={language} timeZone={timeZone} />
      <CurrentDateTime className="hidden max-w-full self-auto sm:block sm:min-w-[22rem]" language={language} timeZone={timeZone} />
    </div>
  );
}
