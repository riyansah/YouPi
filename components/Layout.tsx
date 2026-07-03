"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
      <div className="min-h-screen bg-[#f6f7fb] lg:flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-700"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="ml-3 text-sm font-semibold text-slate-800">Activity Hub</span>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </DashboardDataProvider>
  );
}
