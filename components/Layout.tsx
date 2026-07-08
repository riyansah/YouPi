"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, Menu, Plus, Repeat2, X } from "lucide-react";
import { ActivityOverdueNotifier } from "@/components/ActivityOverdueNotifier";
import { AppFeedbackProvider, useAppFeedback } from "@/components/AppFeedback";
import { Sidebar } from "@/components/Sidebar";
import { DashboardDataProvider, useDashboardStore } from "@/lib/dashboard-store";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/i18n";
import brandIcon from "@/src/image2.png";

interface LayoutProps {
  children: React.ReactNode;
}

function quickActions(language: "en" | "id") {
  return [
    { href: "/tasks", label: language === "id" ? "Tambah Pekerjaan" : "Add Work", icon: BriefcaseBusiness },
    { href: "/activities", label: language === "id" ? "Tambah Aktivitas" : "Add Activity", icon: CalendarDays },
    { href: "/routines", label: language === "id" ? "Tambah Rutinitas" : "Add Routine", icon: Repeat2 }
  ] as const;
}

function GlobalQuickActions() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeToastCount } = useAppFeedback();
  const { settings } = useDashboardStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  const bottomOffset = useMemo(() => 16 + activeToastCount * 88, [activeToastCount]);
  const actions = quickActions(settings.language);

  function handleAction(href: string) {
    if (pathname === href) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("compose", "1");
      const query = params.toString();
      router.push(query ? href + "?" + query : href, { scroll: false });
    } else {
      router.push(href + "?compose=1");
    }

    setOpen(false);
  }

  return (
    <>
      {open ? <button type="button" aria-label={settings.language === "id" ? "Tutup menu aksi cepat" : "Close quick actions"} className="fixed inset-0 z-30 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <div className="fixed right-4 z-40 lg:hidden" style={{ bottom: String(bottomOffset) + "px" }}>
        <div className="flex flex-col items-end gap-3">
          {open
            ? actions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.href}
                    type="button"
                    onClick={() => handleAction(action.href)}
                    className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <span>{action.label}</span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                  </button>
                );
              })
            : null}
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-xl transition hover:bg-teal-800"
            aria-label={open ? (settings.language === "id" ? "Tutup aksi cepat" : "Close quick actions") : settings.language === "id" ? "Buka aksi cepat" : "Open quick actions"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </>
  );
}

function AuthenticatedShell({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useDashboardStore();

  return (
    <div className="min-h-screen bg-[#f6f7fb] lg:flex dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
            onClick={() => setSidebarOpen(true)}
            aria-label={settings.language === "id" ? "Buka sidebar" : "Open sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="ml-2 flex min-w-0 items-center gap-3 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <Image src={brandIcon} alt={BRAND_NAME} className="h-10 w-10 shrink-0 rounded-md object-cover" priority />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">{BRAND_NAME}</span>
              <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">{BRAND_TAGLINE}</span>
            </span>
          </Link>
        </header>
        <ActivityOverdueNotifier />
        <GlobalQuickActions />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return (
    <DashboardDataProvider>
      <AppFeedbackProvider>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </AppFeedbackProvider>
    </DashboardDataProvider>
  );
}
