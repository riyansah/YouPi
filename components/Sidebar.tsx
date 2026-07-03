"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { appRoutes } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { confirm, showToast } = useAppFeedback();

  async function handleLogout() {
    const confirmed = await confirm({
      title: "Logout dari dashboard?",
      description: "Sesi login saat ini akan diakhiri dan Anda perlu masuk lagi untuk melanjutkan.",
      confirmLabel: "Logout",
      tone: "danger"
    });

    if (!confirmed) {
      return;
    }

    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    showToast({ message: "Berhasil logout." });
    window.setTimeout(() => {
      window.location.href = "/login";
    }, 250);
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
          <Link href="/dashboard" onClick={onClose} className="block rounded focus:outline-none focus:ring-2 focus:ring-teal-500">
            <p className="text-sm font-semibold uppercase text-teal-700 dark:text-teal-300">Personal</p>
            <p className="text-xl font-bold text-slate-950 dark:text-slate-50">Activity Hub</p>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200 lg:hidden"
            onClick={onClose}
            aria-label="Tutup sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {appRoutes.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200 dark:bg-teal-950/60 dark:text-teal-100 dark:ring-teal-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
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
            Logout
          </button>
          <div className="rounded border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Fokus hari ini</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Jaga ritme kerja, catat aktivitas, dan tutup hari dengan laporan.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
