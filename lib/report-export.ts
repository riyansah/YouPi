import type { Activity, ReportPeriod, Task, TaskPriority } from "@/lib/types";
import { APP_DEFAULT_TIME_ZONE, getCurrentTimestampInTimeZone } from "@/lib/time";
import {
  activityCategoryChartData,
  filterByReportPeriod,
  filterTasksByReportPeriod,
  getReportDateRange,
  formatDate,
  getEffectiveActivityStatus,
  getEffectiveTaskStatus,
  getReportPeriodLabel,
  reportActivityChartData,
  reportTaskProgressChartData,
  summarizeActivities,
  summarizeTasks,
  taskStatusChartData,
  toCsv,
  todayDate,
  dateKeyFromTimestamp
} from "@/lib/utils";

export type ReportPdfMode = "summary" | "full";

export const reportPdfModes: ReportPdfMode[] = ["summary", "full"];

export const reportCsvColumns = [
  "section",
  "type",
  "label",
  "value",
  "title",
  "status",
  "priority",
  "category",
  "date",
  "start_time",
  "end_time",
  "deadline",
  "completed_at",
  "notes"
] as const;

export type ReportCsvColumn = (typeof reportCsvColumns)[number];
export type ReportCsvRow = Record<ReportCsvColumn, string | number | null>;
export type ReportExcelCell = string | number | null;

export interface ReportMetric {
  label: string;
  value: string | number;
}

export interface ReportExcelSheet {
  name: string;
  rows: ReportExcelCell[][];
}

export interface ReportExportModel {
  period: ReportPeriod;
  periodLabel: string;
  selectedDate: string;
  rangeFrom: string;
  rangeTo: string;
  dateRangeLabel: string;
  currentDate: string;
  generatedAt: string;
  timeZone: string;
  filteredTasks: Task[];
  filteredActivities: Activity[];
  importantTasks: Task[];
  importantActivities: Activity[];
  overdueTasks: Task[];
  taskSummary: ReturnType<typeof summarizeTasks>;
  activitySummary: ReturnType<typeof summarizeActivities>;
  taskStatusSeries: ReturnType<typeof taskStatusChartData>;
  categorySeries: ReturnType<typeof activityCategoryChartData>;
  activitySeries: ReturnType<typeof reportActivityChartData>;
  taskProgressSeries: ReturnType<typeof reportTaskProgressChartData>;
  metrics: ReportMetric[];
  insights: string[];
}

interface BuildReportExportModelInput {
  tasks: Task[];
  activities: Activity[];
  selectedDate: string;
  period: ReportPeriod;
  rangeFrom?: string | null;
  rangeTo?: string | null;
  currentDate?: string;
  generatedAt?: string;
  timeZone?: string;
}

const priorityRank: Record<TaskPriority, number> = {
  Tinggi: 0,
  Sedang: 1,
  Rendah: 2
};

function sortTasksForReport(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const deadline = a.deadline.localeCompare(b.deadline);

    if (deadline !== 0) {
      return deadline;
    }

    const priority = priorityRank[a.priority] - priorityRank[b.priority];

    if (priority !== 0) {
      return priority;
    }

    return a.title.localeCompare(b.title);
  });
}

function sortActivitiesForReport(activities: Activity[]) {
  return [...activities].sort((a, b) => {
    const date = a.date.localeCompare(b.date);

    if (date !== 0) {
      return date;
    }

    const time = a.startTime.localeCompare(b.startTime);

    if (time !== 0) {
      return time;
    }

    return a.title.localeCompare(b.title);
  });
}

function uniqueTasks(tasks: Task[]) {
  const seen = new Set<string>();

  return tasks.filter((task) => {
    if (seen.has(task.id)) {
      return false;
    }

    seen.add(task.id);
    return true;
  });
}

function getImportantTasks(tasks: Task[], currentDate: string, timeZone: string) {
  const ordered = sortTasksForReport(tasks);
  const active = ordered.filter((task) => {
    const status = getEffectiveTaskStatus(task, currentDate, timeZone);
    return status !== "Selesai" && status !== "Dibatalkan";
  });
  const overdue = active.filter((task) => task.deadline < currentDate);
  const highPriority = active.filter((task) => task.priority === "Tinggi");
  const pending = active.filter((task) => getEffectiveTaskStatus(task, currentDate, timeZone) === "Tertunda");
  const important = uniqueTasks([...overdue, ...highPriority, ...pending]);

  return (important.length ? important : ordered).slice(0, 8);
}

function getImportantActivities(activities: Activity[]) {
  const ordered = sortActivitiesForReport(activities);
  const active = ordered.filter((activity) => activity.status !== "Selesai");

  return (active.length ? active : ordered).slice(0, 8);
}

function reportCsvRow(input: Partial<ReportCsvRow>): ReportCsvRow {
  return Object.fromEntries(reportCsvColumns.map((column) => [column, input[column] ?? null])) as ReportCsvRow;
}

function completedDate(task: Task) {
  return task.completedAt ? dateKeyFromTimestamp(task.completedAt) : null;
}

export function buildReportExportModel({
  tasks,
  activities,
  selectedDate,
  period,
  rangeFrom,
  rangeTo,
  currentDate,
  generatedAt = getCurrentTimestampInTimeZone(),
  timeZone = APP_DEFAULT_TIME_ZONE
}: BuildReportExportModelInput): ReportExportModel {
  const resolvedCurrentDate = currentDate || todayDate(timeZone);
  const reportRange = getReportDateRange(selectedDate, period, rangeFrom, rangeTo);
  const dateRangeLabel = reportRange.from === reportRange.to
    ? formatDate(reportRange.from, "id", timeZone)
    : `${formatDate(reportRange.from, "id", timeZone)} - ${formatDate(reportRange.to, "id", timeZone)}`;
  const filteredTasks = sortTasksForReport(filterTasksByReportPeriod(tasks, selectedDate, period, timeZone, reportRange.from, reportRange.to));
  const filteredActivities = sortActivitiesForReport(filterByReportPeriod(activities, selectedDate, period, timeZone, reportRange.from, reportRange.to));
  const taskSummary = summarizeTasks(filteredTasks, resolvedCurrentDate, timeZone);
  const activitySummary = summarizeActivities(filteredActivities, timeZone, resolvedCurrentDate);
  const overdueTasks = filteredTasks.filter((task) => {
    const status = getEffectiveTaskStatus(task, resolvedCurrentDate, timeZone);
    return task.deadline < resolvedCurrentDate && status !== "Selesai" && status !== "Dibatalkan";
  });
  const periodLabel = getReportPeriodLabel(period);

  return {
    period,
    periodLabel,
    selectedDate,
    rangeFrom: reportRange.from,
    rangeTo: reportRange.to,
    dateRangeLabel,
    currentDate: resolvedCurrentDate,
    generatedAt,
    timeZone,
    filteredTasks,
    filteredActivities,
    importantTasks: getImportantTasks(filteredTasks, resolvedCurrentDate, timeZone),
    importantActivities: getImportantActivities(filteredActivities),
    overdueTasks,
    taskSummary,
    activitySummary,
    taskStatusSeries: taskStatusChartData(filteredTasks, resolvedCurrentDate, timeZone),
    categorySeries: activityCategoryChartData(filteredActivities, 4),
    activitySeries: reportActivityChartData(filteredActivities, selectedDate, period, timeZone, reportRange.from, reportRange.to),
    taskProgressSeries: reportTaskProgressChartData(tasks, selectedDate, period, timeZone, reportRange.from, reportRange.to),
    metrics: [
      { label: "Total pekerjaan", value: taskSummary.total },
      { label: "Pekerjaan akan datang", value: taskSummary.upcoming },
      { label: "Pekerjaan berjalan", value: taskSummary.running },
      { label: "Pekerjaan selesai", value: taskSummary.completed },
      { label: "Pekerjaan tertunda", value: taskSummary.pending },
      { label: "Total aktivitas", value: activitySummary.total },
      { label: "Aktivitas paling sering", value: activitySummary.mostFrequentActivity },
      { label: "Kategori dominan", value: activitySummary.dominantCategory },
      { label: "Persentase selesai", value: `${taskSummary.completionRate}%` },
      { label: "Lewat deadline", value: overdueTasks.length }
    ],
    insights: [
      period === "Kustom"
        ? `Pada rentang ${dateRangeLabel}, ada ${taskSummary.completed} pekerjaan selesai dari ${taskSummary.total} pekerjaan.`
        : `Pada ${periodLabel.toLowerCase()} dengan tanggal acuan ${formatDate(selectedDate, "id", timeZone)}, ada ${taskSummary.completed} pekerjaan selesai dari ${taskSummary.total} pekerjaan.`,
      `Tingkat penyelesaian pekerjaan berada di ${taskSummary.completionRate}% dengan ${taskSummary.upcoming} pekerjaan akan datang dan ${overdueTasks.length} pekerjaan melewati deadline.`,
      `Aktivitas tercatat berjumlah ${activitySummary.total}; kategori dominan adalah ${activitySummary.dominantCategory} dan aktivitas paling sering adalah ${activitySummary.mostFrequentActivity}.`
    ]
  };
}

export function buildReportCsvRows(model: ReportExportModel): ReportCsvRow[] {
  const rows: ReportCsvRow[] = [
    reportCsvRow({ section: "metadata", type: "period", label: "Periode", value: model.period }),
    reportCsvRow({ section: "metadata", type: "period_label", label: "Label periode", value: model.periodLabel }),
    reportCsvRow({ section: "metadata", type: "selected_date", label: "Tanggal acuan", value: model.selectedDate }),
    reportCsvRow({ section: "metadata", type: "range_from", label: "Tanggal mulai", value: model.rangeFrom }),
    reportCsvRow({ section: "metadata", type: "range_to", label: "Tanggal selesai", value: model.rangeTo }),
    reportCsvRow({ section: "metadata", type: "generated_at", label: "Generated at", value: model.generatedAt })
  ];

  model.metrics.forEach((metric) => {
    rows.push(reportCsvRow({ section: "ringkasan", type: "metric", label: metric.label, value: metric.value }));
  });

  model.insights.forEach((insight, index) => {
    rows.push(reportCsvRow({ section: "ringkasan", type: "insight", label: `Insight ${index + 1}`, value: insight }));
  });

  model.filteredTasks.forEach((task) => {
    rows.push(
      reportCsvRow({
        section: "pekerjaan",
        type: "task",
        title: task.title,
        status: getEffectiveTaskStatus(task, model.currentDate, model.timeZone),
        priority: task.priority,
        date: task.startDate,
        start_time: task.startTime,
        end_time: task.endTime,
        deadline: task.deadline,
        completed_at: completedDate(task),
        notes: task.description
      })
    );
  });

  model.filteredActivities.forEach((activity) => {
    rows.push(
      reportCsvRow({
        section: "aktivitas",
        type: "activity",
        title: activity.title,
        status: getEffectiveActivityStatus(activity, model.currentDate, model.timeZone),
        category: activity.category,
        date: activity.date,
        start_time: activity.startTime,
        end_time: activity.endTime,
        notes: activity.notes
      })
    );
  });

  model.taskStatusSeries.forEach((item) => {
    rows.push(reportCsvRow({ section: "grafik", type: "status_pekerjaan", label: item.name, value: item.value }));
  });

  model.categorySeries.forEach((item) => {
    rows.push(reportCsvRow({ section: "grafik", type: "kategori_aktivitas", label: item.name, value: item.value }));
  });

  model.activitySeries.forEach((item) => {
    rows.push(reportCsvRow({ section: "grafik", type: "kegiatan", label: item.date, value: item.total }));
  });

  model.taskProgressSeries.forEach((item) => {
    rows.push(reportCsvRow({ section: "grafik", type: "progress_pekerjaan", label: item.date, value: item.completed }));
  });

  return rows;
}

export function buildReportCsvContent(model: ReportExportModel) {
  return toCsv(
    buildReportCsvRows(model).map((row) => ({ ...row })),
    { bom: true, lineEnding: "\r\n" }
  );
}

export function buildReportExcelSheets(model: ReportExportModel): ReportExcelSheet[] {
  return [
    {
      name: "Ringkasan",
      rows: [
        ["Tipe", "Label", "Value"],
        ["Metadata", "Periode", model.period],
        ["Metadata", "Label periode", model.periodLabel],
        ["Metadata", "Tanggal acuan", model.selectedDate],
        ["Metadata", "Tanggal mulai", model.rangeFrom],
        ["Metadata", "Tanggal selesai", model.rangeTo],
        ["Metadata", "Generated at", model.generatedAt],
        ...model.metrics.map((metric) => ["Metric", metric.label, metric.value] as ReportExcelCell[]),
        ...model.insights.map((insight, index) => ["Insight", `Insight ${index + 1}`, insight] as ReportExcelCell[])
      ]
    },
    {
      name: "Pekerjaan",
      rows: [
        ["Judul", "Status", "Prioritas", "Tanggal Mulai", "Deadline", "Jam Mulai", "Jam Selesai", "Selesai Pada", "Deskripsi"],
        ...model.filteredTasks.map((task) => [
          task.title,
          getEffectiveTaskStatus(task, model.currentDate, model.timeZone),
          task.priority,
          task.startDate,
          task.deadline,
          task.startTime,
          task.endTime,
          completedDate(task),
          task.description
        ])
      ]
    },
    {
      name: "Aktivitas",
      rows: [
        ["Judul", "Kategori", "Status", "Tanggal", "Jam Mulai", "Jam Selesai", "Catatan"],
        ...model.filteredActivities.map((activity) => [
          activity.title,
          activity.category,
          getEffectiveActivityStatus(activity, model.currentDate, model.timeZone),
          activity.date,
          activity.startTime,
          activity.endTime,
          activity.notes
        ])
      ]
    },
    {
      name: "Kategori Aktivitas",
      rows: [["Kategori", "Total"], ...model.categorySeries.map((item) => [item.name, item.value])]
    },
    {
      name: "Kegiatan",
      rows: [["Tanggal", "Total"], ...model.activitySeries.map((item) => [item.date, item.total])]
    },
    {
      name: "Progress Pekerjaan",
      rows: [["Tanggal", "Selesai"], ...model.taskProgressSeries.map((item) => [item.date, item.completed])]
    }
  ];
}

function getReportFilenameDateSegment(model: ReportExportModel) {
  if (model.period === "Kustom") {
    return `${model.rangeFrom || "no-date"}-to-${model.rangeTo || "no-date"}`;
  }

  return model.selectedDate || "no-date";
}

export function getReportPdfFilename(model: ReportExportModel, mode: ReportPdfMode) {
  const suffix = mode === "full" ? "full" : "summary";

  return `productivity-report-${model.period.toLowerCase()}-${getReportFilenameDateSegment(model)}-${suffix}.pdf`;
}

export function getReportCsvFilename(model: ReportExportModel) {
  return `productivity-report-${model.period.toLowerCase()}-${getReportFilenameDateSegment(model)}-detail.csv`;
}

export function getReportExcelFilename(model: ReportExportModel) {
  return `productivity-report-${model.period.toLowerCase()}-${getReportFilenameDateSegment(model)}.xls`;
}
