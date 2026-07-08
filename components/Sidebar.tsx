"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useNow } from "@/lib/use-now";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/i18n";
import { getAppRoutes } from "@/lib/navigation";
import { cn, countActivitiesNeedingAction, countActiveWorkItems } from "@/lib/utils";
import brandIcon from "@/src/image2.png";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { confirm, showToast } = useAppFeedback();
  const { tasks, activities, settings } = useDashboardStore();
  const language = settings.language;
  const now = useNow(30000);
  const reference = now ?? Date.now();

  async function handleLogout() {
    const confirmed = await confirm({
      title: language === "id" ? "Logout dari YouPi?" : "Log out of " + BRAND_NAME + "?",
      description:
        language === "id"
          ? "Sesi login saat ini akan diakhiri dan Anda perlu masuk lagi untuk melanjutkan."
          : "Your current session will end and you will need to sign in again to continue.",
      confirmLabel: language === "id" ? "Logout" : "Log out",
      tone: "danger"
    });

    if (!confirmed) {
      return;
    }

    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    showToast({ message: language === "id" ? "Berhasil logout." : "Logged out successfully." });
    window.setTimeout(() => {
      window.location.href = "/login";
    }, 250);
  }

  const routes = getAppRoutes(language);
  const badges = {
    "/tasks": countActiveWorkItems(tasks, reference, settings.timeZone),
    "/activities": countActivitiesNeedingAction(activities, reference, settings.timeZone)
  } as const;

  function getBadgeCopy(href: keyof typeof badges, count: number) {
    if (href === "/tasks") {
      return language === "id"
        ? `${count} pekerjaan sedang berjalan`
        : `${count} work items in progress`;
    }

    return language === "id"
      ? `${count} aktivitas butuh aksi`
      : `${count} activities need action`;
  }

  function getBadgeClassName(href: keyof typeof badges, active: boolean) {
    if (href === "/tasks") {
      return active
        ? "bg-blue-700 text-white dark:bg-blue-300 dark:text-slate-950"
        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100";
    }

    return active
      ? "bg-amber-600 text-white dark:bg-amber-300 dark:text-slate-950"
      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100";
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/45 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-soft transition-transform dark:border-slate-700 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <Image src={brandIcon} alt={BRAND_NAME} className="h-11 w-11 shrink-0 rounded-md object-cover" priority />
            <span className="min-w-0">
              <span className="block text-sm font-semibold uppercase text-teal-700 dark:text-teal-300">{BRAND_NAME}</span>
              <span className="block truncate text-lg font-bold text-slate-950 dark:text-slate-50">{BRAND_TAGLINE}</span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200 lg:hidden"
            onClick={onClose}
            aria-label={language === "id" ? "Tutup sidebar" : "Close sidebar"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {routes.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            const badgeKey = item.href in badges ? (item.href as keyof typeof badges) : null;
            const badgeCount = badgeKey ? badges[badgeKey] : 0;
            const badgeCopy = badgeKey ? getBadgeCopy(badgeKey, badgeCount) : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200 dark:bg-teal-950/60 dark:text-teal-100 dark:ring-teal-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="min-w-0 flex-1">{item.label}</span>
                {badgeCount > 0 ? (
                  <span className="relative flex shrink-0 items-center">
                    <span
                      className={cn(
                        "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        badgeKey ? getBadgeClassName(badgeKey, active) : ""
                      )}
                      aria-label={badgeCopy || `${item.label}: ${badgeCount}`}
                      title={badgeCopy || undefined}
                    >
                      {badgeCount}
                    </span>
                    {badgeCopy ? (
                      <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-max max-w-48 translate-y-1 rounded-md bg-slate-950 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:bg-slate-100 dark:text-slate-950">
                        {badgeCopy}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            {language === "id" ? "Logout" : "Log out"}
          </button>
          <div className="rounded border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {language === "id" ? "Fokus hari ini" : "Today's focus"}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {language === "id"
                ? "Jaga ritme kerja, catat aktivitas, dan tutup hari dengan laporan."
                : "Keep your work on track, log activities, and close the day with a clear report."}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
