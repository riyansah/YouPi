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
import type { Activity, Routine, Task } from "@/lib/types";
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
    <section className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

export function TaskStatusChart({ tasks, title = "Pekerjaan Berdasarkan Status" }: { tasks: Task[]; title?: string }) {
  const data = taskStatusChartData(tasks);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const legendItems = data.map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
    percentage: total ? Math.round((item.value / total) * 100) : 0
  }));

  return (
    <ChartFrame title={title} contentClassName="mt-4 h-[30rem] sm:h-80">
      <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3">
        <div className="relative min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
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
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Pekerjaan</p>
            </div>
          </div>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {legendItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                {item.value} ({item.percentage}%)
              </span>
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
  title = "Aktivitas Per Hari"
}: {
  activities?: Activity[];
  data?: Array<{ date: string; total: number }>;
  title?: string;
}) {
  const resolvedData = data || activityPerDayChartData(activities || []);

  return (
    <ChartFrame title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={resolvedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function DailyActivityChart({
  activities,
  routines,
  title = "Kegiatan Per Hari"
}: {
  activities: Activity[];
  routines: Routine[];
  title?: string;
}) {
  const data = dailyActivityChartData(activities, routines);

  return (
    <ChartFrame title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Bar dataKey="activities" name="Aktivitas" stackId="kegiatan" fill="#2563eb" radius={[0, 0, 0, 0]} />
          <Bar dataKey="routines" name="Rutinitas" stackId="kegiatan" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
          <span className="h-3 w-3 rounded-sm bg-blue-600" />
          <span className="font-medium text-slate-700 dark:text-slate-200">Aktivitas</span>
        </div>
        <div className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
          <span className="h-3 w-3 rounded-sm bg-teal-700" />
          <span className="font-medium text-slate-700 dark:text-slate-200">Rutinitas</span>
        </div>
      </div>
    </ChartFrame>
  );
}

export function ActivityCategoryChart({
  activities,
  title = "Aktivitas Berdasarkan Kategori"
}: {
  activities: Activity[];
  title?: string;
}) {
  const data = activityCategoryChartData(activities);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const legendItems = data.map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
    percentage: total ? Math.round((item.value / total) * 100) : 0
  }));

  return (
    <ChartFrame title={title} contentClassName="mt-4 h-[30rem] sm:h-80">
      <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3">
        <div className="min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={96} label>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {legendItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                {item.value} ({item.percentage}%)
              </span>
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
  title = "Progress Mingguan"
}: {
  tasks?: Task[];
  data?: Array<{ date: string; completed: number }>;
  title?: string;
}) {
  const resolvedData = data || weeklyProgressData(tasks || []);

  return (
    <ChartFrame title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={resolvedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
          <Line type="monotone" dataKey="completed" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
