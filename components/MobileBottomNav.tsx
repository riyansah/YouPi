"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardStore } from "@/lib/dashboard-store";
import { getAppRoutes } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const primaryRouteHrefs = ["/dashboard", "/tasks", "/schedule", "/notes"] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { settings } = useDashboardStore();
  const routes = getAppRoutes(settings.language).filter((route) => primaryRouteHrefs.includes(route.href as (typeof primaryRouteHrefs)[number]));

  return (
    <nav
      aria-label={settings.language === "id" ? "Navigasi utama" : "Primary navigation"}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-slate-700/90 dark:bg-slate-900/95 lg:hidden"
    >
      <div className="mx-auto grid h-[4.5rem] max-w-md grid-cols-4 px-2">
        {routes.map((route) => {
          const Icon = route.icon;
          const active = pathname === route.href || pathname.startsWith(route.href + "/");

          return (
            <Link
              key={route.href}
              href={route.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500",
                active ? "text-teal-800 dark:text-teal-200" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              )}
            >
              <span
                className={cn(
                  "relative inline-flex h-8 w-12 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-teal-100 dark:bg-teal-900/70" : "group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                )}
              >
                <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                {active ? <span className="absolute -top-1 h-1 w-5 rounded-full bg-teal-600 dark:bg-teal-400" /> : null}
              </span>
              <span className="max-w-full truncate">{route.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
