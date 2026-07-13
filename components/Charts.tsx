"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { tCategory, tChartTitle, tTaskStatus } from "@/lib/i18n";
import type { Activity, AppLanguage, Routine, Task } from "@/lib/types";
import {
  activityCategoryChartData,
  activityPerDayChartData,
  dailyActivityChartData,
  taskStatusChartData,
  weeklyProgressData
} from "@/lib/utils";

const colors = ["#0f766e", "#2563eb", "#f59e0b", "#e11d48", "#64748b", "#7c3aed", "#16a34a"];
const tooltipContentStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#f8fafc"
};
const tooltipLabelStyle = { color: "#cbd5e1" };
const tooltipItemStyle = { color: "#f8fafc" };

function ChartFrame({
  title,
  children,
  contentClassName = "mt-4 h-72"
}: {
  title: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className="min-w-0 rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
      <div className={`min-w-0 ${contentClassName}`}>{children}</div>
    </section>
  );
}

export function TaskStatusChart({ tasks, title, maxLegendItems, language = "en", timeZone, contentClassName }: { tasks: Task[]; title?: string; maxLegendItems?: number; language?: AppLanguage; timeZone?: string; contentClassName?: string }) {
  const data = taskStatusChartData(tasks, Date.now(), timeZone).map((item) => ({ ...item, label: tTaskStatus(item.name as never, language) }));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const legendItems = data
    .map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
      percentage: total ? Math.round((item.value / total) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, maxLegendItems || data.length);

  return (
    <ChartFrame title={title || tChartTitle("taskStatus", language)} contentClassName={contentClassName || "mt-4 h-80 sm:h-96"}>
      <div className="grid h-full min-w-0 grid-rows-[minmax(13rem,1fr)_auto] gap-2">
        <div className="relative min-h-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="92%" paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center leading-none">
              <p className="text-2xl font-bold text-slate-950 dark:text-slate-50">{total}</p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{language === "id" ? "Pekerjaan" : "Work"}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:text-sm">
          {legendItems.map((item) => (
            <div key={item.name} className="flex min-w-0 items-center justify-between gap-2 rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-slate-950 dark:text-slate-50">{item.value} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

export function ActivityPerDayChart({
  activities,
  data,
  title,
  language = "en"
}: {
  activities?: Activity[];
  data?: Array<{ date: string; total: number }>;
  title?: string;
  language?: AppLanguage;
}) {
  const resolvedData = data || activityPerDayChartData(activities || []);

  return (
    <ChartFrame title={title || tChartTitle("activityPerDay", language)} contentClassName="mt-4 h-72 sm:h-80">
      <div className="grid h-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-2">
        <div className="min-h-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resolvedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Bar dataKey="total" name={language === "id" ? "Aktivitas" : "Activities"} fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 sm:text-sm">
          <span className="h-3 w-3 shrink-0 rounded-sm bg-blue-600" />
          <span className="font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Aktivitas" : "Activities"}</span>
        </div>
      </div>
    </ChartFrame>
  );
}

export function DailyActivityChart({
  activities,
  routines,
  title,
  language = "en",
  timeZone,
  contentClassName
}: {
  activities: Activity[];
  routines: Routine[];
  title?: string;
  language?: AppLanguage;
  timeZone?: string;
  contentClassName?: string;
}) {
  const data = dailyActivityChartData(activities, routines, undefined, timeZone);

  return (
    <ChartFrame title={title || tChartTitle("dailyActivity", language)} contentClassName={contentClassName || "mt-4 h-64 sm:h-80"}>
      <div className="grid h-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
        <div className="min-h-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Bar dataKey="activities" name={language === "id" ? "Aktivitas" : "Activities"} stackId="kegiatan" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="routines" name={language === "id" ? "Rutinitas" : "Routines"} stackId="kegiatan" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid min-h-[3.5rem] content-start gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="h-3 w-3 rounded-sm bg-blue-600" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Aktivitas" : "Activities"}</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="h-3 w-3 rounded-sm bg-teal-700" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Rutinitas" : "Routines"}</span>
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}

export function ActivityCategoryChart({
  activities,
  title,
  maxItems,
  language = "en"
}: {
  activities: Activity[];
  title?: string;
  maxItems?: number;
  language?: AppLanguage;
}) {
  const data = activityCategoryChartData(activities, maxItems).map((item) => ({ ...item, label: tCategory(item.name as never, language) }));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const legendItems = data.map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
    percentage: total ? Math.round((item.value / total) * 100) : 0
  }));

  return (
    <ChartFrame title={title || tChartTitle("activityCategory", language)} contentClassName="mt-4 h-80 sm:h-96">
      <div className="grid h-full min-w-0 grid-rows-[minmax(13rem,1fr)_auto] gap-2">
        <div className="min-h-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Pie data={data} dataKey="value" nameKey="label" outerRadius="92%">
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:text-sm">
          {legendItems.map((item) => (
            <div key={item.name} className="flex min-w-0 items-center justify-between gap-2 rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-slate-950 dark:text-slate-50">{item.value} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

export function WeeklyProgressChart({
  tasks,
  data,
  title,
  language = "en",
  timeZone,
  contentClassName
}: {
  tasks?: Task[];
  data?: Array<{ date: string; completed: number }>;
  title?: string;
  language?: AppLanguage;
  timeZone?: string;
  contentClassName?: string;
}) {
  const resolvedData = data || weeklyProgressData(tasks || [], timeZone);

  return (
    <ChartFrame title={title || tChartTitle("weeklyProgress", language)} contentClassName={contentClassName || "mt-4 h-64 sm:h-80"}>
      <div className="grid h-full min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
        <div className="min-h-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={resolvedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Line type="monotone" dataKey="completed" name={language === "id" ? "Pekerjaan selesai" : "Completed work"} stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid min-h-[3.5rem] content-start gap-2 text-sm sm:grid-cols-2">
          <div className="flex min-w-0 items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-teal-700" />
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Pekerjaan selesai" : "Completed work"}</span>
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}
