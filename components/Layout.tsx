"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AppFeedbackProvider } from "@/components/AppFeedback";
import { Sidebar } from "@/components/Sidebar";
import { DashboardDataProvider } from "@/lib/dashboard-store";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return (
    <DashboardDataProvider>
      <AppFeedbackProvider>
        <div className="min-h-screen bg-[#f6f7fb] lg:flex dark:bg-slate-950">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:hidden">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/dashboard" className="ml-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Personal Activity Hub
              </Link>
            </header>
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
          </div>
        </div>
      </AppFeedbackProvider>
    </DashboardDataProvider>
  );
}
