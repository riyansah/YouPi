import { Activity, BarChart3, CalendarRange, CheckSquare, History, LayoutDashboard, NotebookPen, Repeat, Settings } from "lucide-react";
import type { AppLanguage } from "@/lib/types";
import { tRoute } from "@/lib/i18n";

export const appRoutes = [
  { href: "/dashboard", icon: LayoutDashboard },
  { href: "/tasks", icon: CheckSquare },
  { href: "/activities", icon: Activity },
  { href: "/routines", icon: Repeat },
  { href: "/schedule", icon: CalendarRange },
  { href: "/notes", icon: NotebookPen },
  { href: "/history", icon: History },
  { href: "/reports", icon: BarChart3 },
  { href: "/settings", icon: Settings }
] as const;

export function getAppRoutes(language: AppLanguage) {
  return appRoutes.map((item) => ({ ...item, label: tRoute(item.href, language) }));
}
