import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Activity, Task } from "@/lib/types";
import { formatDate, formatTimeRange } from "@/lib/utils";
import type { ReportExportModel, ReportPdfMode } from "@/lib/report-export";
import { getReportPdfFilename } from "@/lib/report-export";

interface ExportReportPdfInput {
  model: ReportExportModel;
  mode: ReportPdfMode;
  chartElements: HTMLElement[];
}

type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const page = {
  width: 210,
  height: 297,
  marginX: 14,
  footerY: 286
};

function ensureSpace(doc: jsPDF, y: number, neededHeight: number) {
  if (y + neededHeight <= page.footerY) {
    return y;
  }

  doc.addPage();
  return 18;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  const nextY = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, page.marginX, nextY);

  return nextY + 7;
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);

  return y + lines.length * 5;
}

function addHeader(doc: jsPDF, model: ReportExportModel, mode: ReportPdfMode) {
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, page.width, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Laporan Produktivitas", page.marginX, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${model.period} - ${model.periodLabel} | Tanggal acuan ${formatDate(model.selectedDate)}`, page.marginX, 24);
  doc.text(`Mode: ${mode}`, page.marginX, 30);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(model.generatedAt).toLocaleString("id-ID")}`, 126, 24);
}

function addMetrics(doc: jsPDF, model: ReportExportModel, startY: number) {
  const cardWidth = 43;
  const cardHeight = 20;
  const gap = 3;
  let y = startY;

  model.metrics.forEach((metric, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = page.marginX + col * (cardWidth + gap);
    y = startY + row * (cardHeight + gap);

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(metric.label, x + 3, y + 6);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(String(metric.value).length > 14 ? 9 : 13);
    const value = doc.splitTextToSize(String(metric.value), cardWidth - 6);
    doc.text(value.slice(0, 2), x + 3, y + 14);
  });

  return y + cardHeight + 8;
}

function addInsights(doc: jsPDF, model: ReportExportModel, startY: number) {
  let y = addSectionTitle(doc, `Ringkasan ${model.periodLabel}`, startY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  model.insights.forEach((insight) => {
    y = ensureSpace(doc, y, 12);
    doc.circle(page.marginX + 1.5, y - 1.5, 1, "F");
    y = addWrappedText(doc, insight, page.marginX + 6, y, 170) + 1;
  });

  return y + 3;
}

async function captureChart(element: HTMLElement) {
  return toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff"
  });
}

async function addCharts(doc: jsPDF, chartElements: HTMLElement[], startY: number) {
  let y = addSectionTitle(doc, "Grafik", startY);
  const gap = 6;
  const imageWidth = 86;
  const imageHeight = 70;

  for (let index = 0; index < chartElements.length; index += 1) {
    if (index % 2 === 0) {
      y = ensureSpace(doc, y, imageHeight + 8);
    }

    const x = page.marginX + (index % 2) * (imageWidth + gap);

    try {
      const image = await captureChart(chartElements[index]);
      doc.addImage(image, "PNG", x, y, imageWidth, imageHeight, undefined, "FAST");
    } catch {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, imageWidth, imageHeight, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Grafik tidak bisa dirender ke PDF.", x + 6, y + 12);
    }

    if (index % 2 === 1 || index === chartElements.length - 1) {
      y += imageHeight + 7;
    }
  }

  return y + 2;
}

function formatOptionalTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) {
    return "-";
  }

  return formatTimeRange(startTime || "-", endTime || "-");
}

function taskRows(tasks: Task[]) {
  return tasks.map((task) => [
    task.title,
    task.status,
    task.priority,
    formatDate(task.deadline),
    formatOptionalTimeRange(task.startTime, task.endTime),
    task.completedAt ? formatDate(task.completedAt.slice(0, 10)) : "-"
  ]);
}

function activityRows(activities: Activity[]) {
  return activities.map((activity) => [
    activity.title,
    activity.category,
    activity.status,
    formatDate(activity.date),
    formatTimeRange(activity.startTime, activity.endTime),
    activity.notes || "-"
  ]);
}

function addTable(doc: PdfWithAutoTable, title: string, startY: number, head: string[], body: string[][], emptyText: string) {
  const y = addSectionTitle(doc, title, startY);

  if (!body.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(emptyText, page.marginX, y);
    return y + 8;
  }

  autoTable(doc, {
    head: [head],
    body,
    startY: y,
    margin: { left: page.marginX, right: page.marginX, bottom: 16 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "top"
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  return (doc.lastAutoTable?.finalY || y) + 8;
}

function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();

  for (let index = 1; index <= pageCount; index += 1) {
    doc.setPage(index);
    doc.setDrawColor(226, 232, 240);
    doc.line(page.marginX, 282, page.width - page.marginX, 282);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Personal Activity Dashboard", page.marginX, 288);
    doc.text(`Halaman ${index} dari ${pageCount}`, page.width - page.marginX, 288, { align: "right" });
  }
}

export async function exportReportPdf({ model, mode, chartElements }: ExportReportPdfInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" }) as PdfWithAutoTable;
  const tasks = mode === "Semua data filter" ? model.filteredTasks : model.importantTasks;
  const activities = mode === "Semua data filter" ? model.filteredActivities : model.importantActivities;
  const detailLabel = mode === "Semua data filter" ? "Semua Data Filter" : "Detail Penting";

  addHeader(doc, model, mode);
  let y = addMetrics(doc, model, 42);
  y = addInsights(doc, model, y);
  y = await addCharts(doc, chartElements, y);
  y = addTable(
    doc,
    `Pekerjaan - ${detailLabel}`,
    y,
    ["Judul", "Status", "Prioritas", "Deadline", "Jam", "Selesai"],
    taskRows(tasks),
    "Tidak ada pekerjaan sesuai filter laporan."
  );
  addTable(
    doc,
    `Aktivitas - ${detailLabel}`,
    y,
    ["Judul", "Kategori", "Status", "Tanggal", "Jam", "Catatan"],
    activityRows(activities),
    "Tidak ada aktivitas sesuai filter laporan."
  );
  addFooters(doc);
  doc.save(getReportPdfFilename(model, mode));
}
