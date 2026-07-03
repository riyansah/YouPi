"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { ActivityCategoryChart, ActivityPerDayChart, TaskStatusChart, WeeklyProgressChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { useDashboardStore } from "@/lib/dashboard-store";
import type { ReportPeriod } from "@/lib/types";
import {
  filterByReportPeriod,
  filterTasksByReportPeriod,
  formatDate,
  getReportChartTitle,
  getReportPeriodLabel,
  reportActivityChartData,
  reportTaskProgressChartData,
  summarizeActivities,
  summarizeTasks,
  toCsv,
  todayDate
} from "@/lib/utils";

const periods: ReportPeriod[] = ["Harian", "Mingguan", "Bulanan"];

export default function ReportsPage() {
  const { tasks, activities } = useDashboardStore();
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [period, setPeriod] = useState<ReportPeriod>("Mingguan");

  const filteredTasks = useMemo(() => filterTasksByReportPeriod(tasks, selectedDate, period), [period, selectedDate, tasks]);
  const filteredActivities = useMemo(() => filterByReportPeriod(activities, selectedDate, period), [activities, period, selectedDate]);
  const taskSummary = summarizeTasks(filteredTasks);
  const activitySummary = summarizeActivities(filteredActivities);
  const overdueTasks = filteredTasks.filter(
    (task) => task.deadline < todayDate() && task.status !== "Selesai" && task.status !== "Dibatalkan"
  );
  const periodLabel = getReportPeriodLabel(period);
  const activitySeries = useMemo(() => reportActivityChartData(filteredActivities, selectedDate, period), [filteredActivities, period, selectedDate]);
  const taskProgressSeries = useMemo(() => reportTaskProgressChartData(tasks, selectedDate, period), [period, selectedDate, tasks]);

  function exportCsv() {
    const rows = [
      { metric: "Periode", value: period },
      { metric: "Label periode", value: periodLabel },
      { metric: "Tanggal acuan", value: selectedDate },
      { metric: "Total pekerjaan", value: taskSummary.total },
      { metric: "Pekerjaan selesai", value: taskSummary.completed },
      { metric: "Pekerjaan tertunda", value: taskSummary.pending },
      { metric: "Total aktivitas", value: activitySummary.total },
      { metric: "Aktivitas paling sering", value: activitySummary.mostFrequentActivity },
      { metric: "Kategori dominan", value: activitySummary.dominantCategory },
      { metric: "Persentase selesai", value: `${taskSummary.completionRate}%` },
      { metric: "Pekerjaan lewat deadline", value: overdueTasks.length }
    ];
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-produktivitas-${period.toLowerCase()}-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Laporan</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">Laporan Produktivitas</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ringkasan harian, mingguan, dan bulanan dari data pribadi.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Tanggal acuan</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Jenis laporan</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {periods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total pekerjaan" value={taskSummary.total} icon={FileText} tone="slate" />
        <StatCard title="Pekerjaan selesai" value={taskSummary.completed} tone="teal" />
        <StatCard title="Pekerjaan tertunda" value={taskSummary.pending} tone="amber" />
        <StatCard title="Total aktivitas" value={activitySummary.total} tone="blue" />
        <StatCard title="Aktivitas paling sering" value={activitySummary.mostFrequentActivity} tone="slate" />
        <StatCard title="Kategori dominan" value={activitySummary.dominantCategory} tone="blue" />
        <StatCard title="Persentase selesai" value={`${taskSummary.completionRate}%`} tone="teal" />
        <StatCard title="Lewat deadline" value={overdueTasks.length} tone="rose" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TaskStatusChart tasks={filteredTasks} title={getReportChartTitle("Pekerjaan Berdasarkan Status", period)} />
        <ActivityCategoryChart activities={filteredActivities} title={getReportChartTitle("Aktivitas Berdasarkan Kategori", period)} />
        <ActivityPerDayChart data={activitySeries} title={getReportChartTitle("Kegiatan", period)} />
        <WeeklyProgressChart data={taskProgressSeries} title={getReportChartTitle("Progress Pekerjaan", period)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Ringkasan {periodLabel}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Pada {periodLabel.toLowerCase()} dengan tanggal acuan {formatDate(selectedDate)}, ada <strong>{taskSummary.completed}</strong> pekerjaan selesai dari <strong>{taskSummary.total}</strong> pekerjaan dan <strong>{activitySummary.total}</strong> aktivitas tercatat.
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Sorotan {periodLabel}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Kategori dominan saat ini adalah <strong>{activitySummary.dominantCategory}</strong> dengan tingkat penyelesaian pekerjaan <strong>{taskSummary.completionRate}%</strong> dan <strong>{overdueTasks.length}</strong> pekerjaan melewati deadline.
          </p>
        </div>
      </section>
    </div>
  );
}
