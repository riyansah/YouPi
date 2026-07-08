"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarClock, Clock3, Download, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { ActivityCategoryChart, ActivityPerDayChart, TaskStatusChart, WeeklyProgressChart } from "@/components/Charts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { tPeriod, tReportPdfMode } from "@/lib/i18n";
import type { ReportPdfMode } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/dashboard-store";
import { buildReportCsvContent, buildReportExportModel, getReportCsvFilename } from "@/lib/report-export";
import { exportReportExcel } from "@/lib/report-excel";
import { exportReportPdf } from "@/lib/report-pdf";
import { getCurrentTimestampInTimeZone } from "@/lib/time";
import type { ReportPeriod } from "@/lib/types";
import { formatDate, todayDate } from "@/lib/utils";

const periods: ReportPeriod[] = ["Harian", "Mingguan", "Bulanan"];
const pdfModes: ReportPdfMode[] = ["summary", "full"];

export default function ReportsPage() {
  const { tasks, activities, settings } = useDashboardStore();
  const language = settings.language;
  const timeZone = settings.timeZone;
  const { showToast } = useAppFeedback();
  const [selectedDate, setSelectedDate] = useState(() => todayDate(timeZone));
  const [period, setPeriod] = useState<ReportPeriod>("Mingguan");
  const [pdfMode, setPdfMode] = useState<ReportPdfMode>("summary");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const chartRefs = useRef<Array<HTMLDivElement | null>>([]);

  const report = useMemo(() => buildReportExportModel({ tasks, activities, selectedDate, period, timeZone }), [activities, period, selectedDate, tasks, timeZone]);

  const text = {
    eyebrow: language === "id" ? "Laporan" : "Reports",
    title: language === "id" ? "Laporan Produktivitas" : "Productivity Reports",
    description: language === "id" ? "Ringkasan harian, mingguan, dan bulanan dari data pribadi." : "Daily, weekly, and monthly summaries of your personal data.",
    referenceDate: language === "id" ? "Tanggal acuan" : "Reference date",
    reportType: language === "id" ? "Jenis laporan" : "Report type",
    pdfMode: language === "id" ? "Mode PDF" : "PDF mode",
    csvDone: language === "id" ? "CSV laporan detail berhasil dibuat." : "Detailed report CSV created successfully.",
    excelDone: language === "id" ? "Excel laporan berhasil dibuat." : "Report Excel created successfully.",
    pdfDone: language === "id" ? "PDF laporan berhasil dibuat." : "Report PDF created successfully.",
    excelError: language === "id" ? "Gagal membuat Excel. Coba muat ulang halaman lalu export kembali." : "Failed to create Excel. Reload the page and try again.",
    pdfError: language === "id" ? "Gagal membuat PDF. Coba muat ulang halaman lalu export kembali." : "Failed to create PDF. Reload the page and try again.",
    creating: language === "id" ? "Membuat..." : "Creating...",
    exportExcel: language === "id" ? "Export Excel" : "Export Excel",
    exportPdf: language === "id" ? "Export PDF" : "Export PDF",
    totalWork: language === "id" ? "Total pekerjaan" : "Total work",
    upcoming: language === "id" ? "Akan datang" : "Upcoming",
    running: language === "id" ? "Sedang berjalan" : "In progress",
    completed: language === "id" ? "Pekerjaan selesai" : "Completed work",
    pending: language === "id" ? "Pekerjaan tertunda" : "Pending work",
    totalActivities: language === "id" ? "Total aktivitas" : "Total activities",
    frequent: language === "id" ? "Aktivitas paling sering" : "Most frequent activity",
    dominant: language === "id" ? "Kategori dominan" : "Top category",
    completion: language === "id" ? "Persentase selesai" : "Completion rate",
    overdue: language === "id" ? "Lewat deadline" : "Overdue",
    summary: language === "id" ? `Ringkasan ${report.periodLabel}` : `${tPeriod(period, language)} Summary`,
    highlights: language === "id" ? `Sorotan ${report.periodLabel}` : `${tPeriod(period, language)} Highlights`
  };

  function latestReport() {
    return buildReportExportModel({ tasks, activities, selectedDate, period, generatedAt: getCurrentTimestampInTimeZone(timeZone), timeZone });
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
    showToast({ message: text.csvDone });
  }

  function exportExcel() {
    setExportError(null);
    setExportingExcel(true);
    try {
      exportReportExcel(latestReport());
      showToast({ message: text.excelDone });
    } catch {
      setExportError(text.excelError);
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
      showToast({ message: text.pdfDone });
    } catch {
      setExportError(text.pdfError);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={text.eyebrow} title={text.title} description={text.description} language={language} timeZone={timeZone} />

      <section className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.referenceDate}</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.reportType}</span><select value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{periods.map((item) => <option key={item} value={item}>{tPeriod(item, language)}</option>)}</select></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{text.pdfMode}</span><select value={pdfMode} onChange={(event) => setPdfMode(event.target.value as ReportPdfMode)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{pdfModes.map((item) => <option key={item} value={item}>{tReportPdfMode(item, language)}</option>)}</select></label>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950"><Download className="h-4 w-4" />Export CSV</button>
          <button type="button" onClick={exportExcel} disabled={exportingExcel} className="inline-flex items-center justify-center gap-2 rounded border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950"><FileSpreadsheet className="h-4 w-4" />{exportingExcel ? text.creating : text.exportExcel}</button>
          <button type="button" onClick={exportPdf} disabled={exportingPdf} className="inline-flex items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"><FileDown className="h-4 w-4" />{exportingPdf ? text.creating : text.exportPdf}</button>
        </div>
        {exportError ? <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-300">{exportError}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={text.totalWork} value={report.taskSummary.total} icon={FileText} tone="slate" />
        <StatCard title={text.upcoming} value={report.taskSummary.upcoming} icon={CalendarClock} tone="slate" />
        <StatCard title={text.running} value={report.taskSummary.running} icon={Clock3} tone="blue" />
        <StatCard title={text.completed} value={report.taskSummary.completed} tone="teal" />
        <StatCard title={text.pending} value={report.taskSummary.pending} tone="amber" />
        <StatCard title={text.totalActivities} value={report.activitySummary.total} tone="blue" />
        <StatCard title={text.frequent} value={report.activitySummary.mostFrequentActivity} tone="slate" />
        <StatCard title={text.dominant} value={report.activitySummary.dominantCategory} tone="blue" />
        <StatCard title={text.completion} value={`${report.taskSummary.completionRate}%`} tone="teal" />
        <StatCard title={text.overdue} value={report.overdueTasks.length} tone="rose" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div ref={setChartRef(0)}><TaskStatusChart tasks={report.filteredTasks} language={language} timeZone={timeZone} /></div>
        <div ref={setChartRef(1)}><ActivityCategoryChart activities={report.filteredActivities} language={language} maxItems={4} /></div>
        <div ref={setChartRef(2)}><ActivityPerDayChart data={report.activitySeries} language={language} /></div>
        <div ref={setChartRef(3)}><WeeklyProgressChart data={report.taskProgressSeries} language={language} timeZone={timeZone} /></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{text.summary}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{language === "id" ? `Pada ${report.periodLabel.toLowerCase()} dengan tanggal acuan ${formatDate(selectedDate, language, timeZone)}, ada ` : `For ${tPeriod(period, language).toLowerCase()} with reference date ${formatDate(selectedDate, language, timeZone)}, there are `}<strong>{report.taskSummary.completed}</strong>{language === "id" ? " pekerjaan selesai, " : " completed work items, "}<strong>{report.taskSummary.running}</strong>{language === "id" ? " berjalan, dan " : " in progress, and "}<strong>{report.taskSummary.upcoming}</strong>{language === "id" ? " akan datang dari " : " upcoming out of "}<strong>{report.taskSummary.total}</strong>{language === "id" ? " pekerjaan serta " : " total work items and "}<strong>{report.activitySummary.total}</strong>{language === "id" ? " aktivitas tercatat." : " recorded activities."}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{text.highlights}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{language === "id" ? "Kategori dominan saat ini adalah " : "The current dominant category is "}<strong>{report.activitySummary.dominantCategory}</strong>{language === "id" ? " dengan tingkat penyelesaian pekerjaan " : " with a work completion rate of "}<strong>{report.taskSummary.completionRate}%</strong>{language === "id" ? " dan " : " and "}<strong>{report.overdueTasks.length}</strong>{language === "id" ? " pekerjaan melewati deadline." : " overdue work items."}</p>
        </div>
      </section>
    </div>
  );
}
