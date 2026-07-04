import { buildReportExcelSheets, getReportExcelFilename } from "@/lib/report-export";
import type { ReportExcelCell, ReportExportModel } from "@/lib/report-export";

function sanitizeXmlValue(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function escapeXml(value: string) {
  return sanitizeXmlValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cellXml(value: ReportExcelCell) {
  if (typeof value === "number") {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }

  return `<Cell><Data ss:Type="String">${escapeXml(String(value ?? ""))}</Data></Cell>`;
}

function rowXml(row: ReportExcelCell[]) {
  return `<Row>${row.map(cellXml).join("")}</Row>`;
}

function worksheetXml(name: string, rows: ReportExcelCell[][]) {
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${rows.map(rowXml).join("")}</Table></Worksheet>`;
}

function workbookXml(model: ReportExportModel) {
  const sheets = buildReportExcelSheets(model);

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
<Title>Laporan Produktivitas</Title>
<Created>${escapeXml(model.generatedAt)}</Created>
</DocumentProperties>
<Styles>
<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10"/></Style>
</Styles>
${sheets.map((sheet) => worksheetXml(sheet.name, sheet.rows)).join("\n")}
</Workbook>`;
}

export function exportReportExcel(model: ReportExportModel) {
  const blob = new Blob([workbookXml(model)], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getReportExcelFilename(model);
  link.click();
  URL.revokeObjectURL(url);
}
