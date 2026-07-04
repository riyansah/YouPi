"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { ActivityCategoryChart, ActivityPerDayChart, TaskStatusChart, WeeklyProgressChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { useDashboardStore } from "@/lib/dashboard-store";
import { buildReportCsvContent, buildReportExportModel, getReportCsvFilename, reportPdfModes } from "@/lib/report-export";
import type { ReportPdfMode } from "@/lib/report-export";
import { exportReportExcel } from "@/lib/report-excel";
import { exportReportPdf } from "@/lib/report-pdf";
import type { ReportPeriod } from "@/lib/types";
import { formatDate, getReportChartTitle, todayDate } from "@/lib/utils";

const periods: ReportPeriod[] = ["Harian", "Mingguan", "Bulanan"];

export default function ReportsPage() {
  const { tasks, activities } = useDashboardStore();
  const { showToast } = useAppFeedback();
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [period, setPeriod] = useState<ReportPeriod>("Mingguan");
  const [pdfMode, setPdfMode] = useState<ReportPdfMode>("Ringkas + detail penting");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const chartRefs = useRef<Array<HTMLDivElement | null>>([]);

  const report = useMemo(() => buildReportExportModel({ tasks, activities, selectedDate, period }), [activities, period, selectedDate, tasks]);

  function latestReport() {
    return buildReportExportModel({
      tasks,
      activities,
      selectedDate,
      period,
      generatedAt: new Date().toISOString()
    });
  }

  function setChartRef(index: number) {
    return (node: HTMLDivElement | null) => {
      chartRefs.current[index] = node;
    };
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    setExportError(null);
    const currentReport = latestReport();
    const blob = new Blob([buildReportCsvContent(currentReport)], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, getReportCsvFilename(currentReport));
    showToast({ message: "CSV laporan detail berhasil dibuat." });
  }

  function exportExcel() {
    setExportError(null);
    setExportingExcel(true);

    try {
      exportReportExcel(latestReport());
      showToast({ message: "Excel laporan berhasil dibuat." });
    } catch {
      setExportError("Gagal membuat Excel. Coba muat ulang halaman lalu export kembali.");
    } finally {
      setExportingExcel(false);
    }
  }

  async function exportPdf() {
    setExportError(null);
    setExportingPdf(true);

    try {
      const chartElements = chartRefs.current.filter((item): item is HTMLDivElement => Boolean(item));

      await exportReportPdf({ model: latestReport(), mode: pdfMode, chartElements });
      showToast({ message: "PDF laporan berhasil dibuat." });
    } catch {
      setExportError("Gagal membuat PDF. Coba muat ulang halaman lalu export kembali.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Laporan</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">Laporan Produktivitas</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ringkasan harian, mingguan, dan bulanan dari data pribadi.</p>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[28rem]">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Mode PDF</span>
            <select
              value={pdfMode}
              onChange={(event) => setPdfMode(event.target.value as ReportPdfMode)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {reportPdfModes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center justify-center gap-2 rounded border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportingExcel ? "Membuat..." : "Export Excel"}
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={exportingPdf}
              className="inline-flex items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FileDown className="h-4 w-4" />
              {exportingPdf ? "Membuat..." : "Export PDF"}
            </button>
          </div>
          {exportError ? <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{exportError}</p> : null}
        </div>
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
        <StatCard title="Total pekerjaan" value={report.taskSummary.total} icon={FileText} tone="slate" />
        <StatCard title="Pekerjaan selesai" value={report.taskSummary.completed} tone="teal" />
        <StatCard title="Pekerjaan tertunda" value={report.taskSummary.pending} tone="amber" />
        <StatCard title="Total aktivitas" value={report.activitySummary.total} tone="blue" />
        <StatCard title="Aktivitas paling sering" value={report.activitySummary.mostFrequentActivity} tone="slate" />
        <StatCard title="Kategori dominan" value={report.activitySummary.dominantCategory} tone="blue" />
        <StatCard title="Persentase selesai" value={`${report.taskSummary.completionRate}%`} tone="teal" />
        <StatCard title="Lewat deadline" value={report.overdueTasks.length} tone="rose" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div ref={setChartRef(0)}>
          <TaskStatusChart tasks={report.filteredTasks} title={getReportChartTitle("Pekerjaan Berdasarkan Status", period)} />
        </div>
        <div ref={setChartRef(1)}>
          <ActivityCategoryChart activities={report.filteredActivities} title={getReportChartTitle("Aktivitas Berdasarkan Kategori", period)} maxItems={4} />
        </div>
        <div ref={setChartRef(2)}>
          <ActivityPerDayChart data={report.activitySeries} title={getReportChartTitle("Kegiatan", period)} />
        </div>
        <div ref={setChartRef(3)}>
          <WeeklyProgressChart data={report.taskProgressSeries} title={getReportChartTitle("Progress Pekerjaan", period)} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Ringkasan {report.periodLabel}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Pada {report.periodLabel.toLowerCase()} dengan tanggal acuan {formatDate(selectedDate)}, ada <strong>{report.taskSummary.completed}</strong> pekerjaan selesai dari <strong>{report.taskSummary.total}</strong> pekerjaan dan <strong>{report.activitySummary.total}</strong> aktivitas tercatat.
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Sorotan {report.periodLabel}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Kategori dominan saat ini adalah <strong>{report.activitySummary.dominantCategory}</strong> dengan tingkat penyelesaian pekerjaan <strong>{report.taskSummary.completionRate}%</strong> dan <strong>{report.overdueTasks.length}</strong> pekerjaan melewati deadline.
          </p>
        </div>
      </section>
    </div>
  );
}
