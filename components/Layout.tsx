"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, Menu, NotebookPen, Plus, Repeat2, X } from "lucide-react";
import { ActivityOverdueNotifier } from "@/components/ActivityOverdueNotifier";
import { AppFeedbackProvider, useAppFeedback } from "@/components/AppFeedback";
import { Sidebar } from "@/components/Sidebar";
import { DashboardDataProvider, useDashboardStore } from "@/lib/dashboard-store";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/i18n";
import { getOutlineButtonClassName } from "@/lib/ui-state-styles";
import brandIcon from "@/src/image2.png";

interface LayoutProps {
  children: React.ReactNode;
}

function quickActions(language: "en" | "id") {
  return [
    { href: "/tasks", label: language === "id" ? "Tambah Pekerjaan" : "Add Work", icon: BriefcaseBusiness },
    { href: "/activities", label: language === "id" ? "Tambah Aktivitas" : "Add Activity", icon: CalendarDays },
    { href: "/routines", label: language === "id" ? "Tambah Rutinitas" : "Add Routine", icon: Repeat2 },
    { href: "/notes", label: language === "id" ? "Tambah Catatan" : "Add Notes", icon: NotebookPen }
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
                    className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <span>{action.label}</span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white dark:bg-teal-600">
                      <Icon className="h-4 w-4" />
                    </span>
                  </button>
                );
              })
            : null}
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-xl transition hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
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

const idleLogoutMs = 15 * 60 * 1000;
const idleHeartbeatMs = 60 * 1000;

function IdleLogoutController() {
  const { settings } = useDashboardStore();
  const lastActivityRef = useRef(Date.now());
  const lastHeartbeatRef = useRef(0);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    let timeoutId: number | null = null;

    function redirectToLogin() {
      window.location.href = "/login?reason=idle";
    }

    async function logoutForIdle() {
      if (loggingOutRef.current) {
        return;
      }

      loggingOutRef.current = true;
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
      redirectToLogin();
    }

    function scheduleLogout() {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      const remaining = Math.max(0, idleLogoutMs - (Date.now() - lastActivityRef.current));
      timeoutId = window.setTimeout(() => {
        void logoutForIdle();
      }, remaining);
    }

    function heartbeat(force = false) {
      const now = Date.now();
      if (!force && now - lastHeartbeatRef.current < idleHeartbeatMs) {
        return;
      }

      lastHeartbeatRef.current = now;
      void fetch("/api/auth/status", { method: "GET", cache: "no-store" }).then((response) => {
        if (response.status === 401) {
          redirectToLogin();
        }
      }).catch(() => null);
    }

    function markActive() {
      lastActivityRef.current = Date.now();
      scheduleLogout();
      heartbeat();
    }

    const events = ["click", "keydown", "pointerdown", "scroll", "touchstart"] as const;
    events.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));
    document.addEventListener("visibilitychange", markActive);
    scheduleLogout();
    heartbeat(true);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      events.forEach((eventName) => window.removeEventListener(eventName, markActive));
      document.removeEventListener("visibilitychange", markActive);
    };
  }, [settings.language]);

  return null;
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
            className={getOutlineButtonClassName() + " h-10 w-10 justify-center px-0"}
            onClick={() => setSidebarOpen(true)}
            aria-label={settings.language === "id" ? "Buka sidebar" : "Open sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <Image src={brandIcon} alt={BRAND_NAME} className="h-9 w-9 shrink-0 rounded-md object-cover" priority />
            <span className="min-w-0 leading-tight">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">{BRAND_NAME}</span>
              <span className="block text-[13px] font-bold text-slate-900 dark:text-slate-100">{BRAND_TAGLINE}</span>
            </span>
          </Link>
        </header>
        <ActivityOverdueNotifier />
        <IdleLogoutController />
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
