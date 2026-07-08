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
import { getOutlineButtonClassName, getSemanticChipClassName } from "@/lib/ui-state-styles";
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
      return language === "id" ? `${count} pekerjaan sedang berjalan` : `${count} work items in progress`;
    }

    return language === "id" ? `${count} aktivitas butuh aksi` : `${count} activities need action`;
  }

  function getBadgeClassName(href: keyof typeof badges, active: boolean) {
    if (href === "/tasks") {
      return active ? "bg-blue-200 text-blue-950 dark:bg-blue-200 dark:text-slate-950" : getSemanticChipClassName("info");
    }

    return active ? "bg-amber-200 text-amber-950 dark:bg-amber-200 dark:text-slate-950" : getSemanticChipClassName("warning");
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
        <div className="mb-8 flex items-start justify-between gap-3">
          <Link href="/dashboard" onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <Image src={brandIcon} alt={BRAND_NAME} className="h-10 w-10 shrink-0 rounded-md object-cover sm:h-11 sm:w-11" priority />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">{BRAND_NAME}</span>
              <span className="mt-0.5 block text-[15px] font-bold text-slate-950 dark:text-slate-50">{BRAND_TAGLINE}</span>
            </span>
          </Link>
          <button
            type="button"
            className={getOutlineButtonClassName() + " h-10 w-10 justify-center px-0 lg:hidden"}
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
                  "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-teal-50 text-teal-900 ring-1 ring-inset ring-teal-200 dark:bg-teal-950/40 dark:text-teal-50 dark:ring-teal-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="min-w-0 flex-1">{item.label}</span>
                {badgeCount > 0 ? (
                  <span className="relative flex shrink-0 items-center">
                    <span
                      className={cn(
                        "inline-flex min-w-6 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold",
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
          <button type="button" onClick={handleLogout} className={getOutlineButtonClassName() + " w-full justify-center gap-2"}>
            <LogOut className="h-4 w-4" />
            {language === "id" ? "Logout" : "Log out"}
          </button>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{language === "id" ? "Fokus hari ini" : "Today's focus"}</p>
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
