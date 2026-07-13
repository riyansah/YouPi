"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { Download, FileJson, KeyRound, LoaderCircle, RotateCcw, Save, Upload, X } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { PageHeader } from "@/components/PageHeader";
import { useDashboardStore } from "@/lib/dashboard-store";
import {
  getDashboardBackupErrorMessage,
  MAX_DASHBOARD_BACKUP_BYTES,
  parseDashboardBackup,
  type DashboardBackup,
  type DashboardBackupVersion
} from "@/lib/storage";
import { tTheme } from "@/lib/i18n";
import { getFieldClassName } from "@/lib/field-styles";
import type { AppLanguage, ThemePreference } from "@/lib/types";
import { APP_DEFAULT_TIME_ZONE, formatDateTimeInTimeZone, getDateKeyFromTimestamp } from "@/lib/time";
import { cn } from "@/lib/utils";

const themes: ThemePreference[] = ["Terang", "Gelap", "Sistem"];
const languages: AppLanguage[] = ["en", "id"];

interface PendingBackup {
  backup: DashboardBackup;
  sourceVersion: DashboardBackupVersion;
  fileName: string;
  fileSize: number;
}

async function fetchDashboardBackup() {
  const response = await fetch("/api/backup");
  if (!response.ok) {
    throw new Error("Backup request failed.");
  }

  const parsed = parseDashboardBackup(await response.text());
  if (!parsed.ok) {
    throw new Error("Backup response is invalid.");
  }

  return parsed.backup;
}

function downloadDashboardBackup(backup: DashboardBackup, prefix: string) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${prefix}-${getDateKeyFromTimestamp(backup.exportedAt)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatFileSize(bytes: number, language: AppLanguage) {
  const locale = language === "id" ? "id-ID" : "en-US";
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

export default function SettingsPage() {
  const { settings, setSettings, restoreDashboardBackup, resetDashboardData } = useDashboardStore();
  const { confirm, showToast } = useAppFeedback();
  const [saved, setSaved] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<PendingBackup | null>(null);
  const [isReadingBackup, setIsReadingBackup] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const language = settings.language;
  const dataActionInProgress = isReadingBackup || isExporting || isRestoring || isResetting;
  const pendingExportedAt = pendingBackup
    ? formatDateTimeInTimeZone(
        pendingBackup.backup.exportedAt,
        language === "id" ? "id-ID" : "en-US",
        APP_DEFAULT_TIME_ZONE,
        { dateStyle: "medium", timeStyle: "short" }
      )
    : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function clearDataMessages() {
    setDataMessage(null);
    setResetMessage(null);
  }

  async function handleExport() {
    setIsExporting(true);
    clearDataMessages();

    try {
      const backup = await fetchDashboardBackup();
      downloadDashboardBackup(backup, "youpi");
      showToast({ message: language === "id" ? "Backup JSON berhasil dibuat." : "JSON backup created successfully." });
    } catch {
      setDataMessage(language === "id" ? "Backup gagal dibuat." : "Backup export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setPendingBackup(null);
    clearDataMessages();

    if (file.size > MAX_DASHBOARD_BACKUP_BYTES) {
      setDataMessage(getDashboardBackupErrorMessage({ code: "file-too-large" }, language));
      return;
    }

    setIsReadingBackup(true);

    try {
      const parsed = parseDashboardBackup(await file.text());

      if (!parsed.ok) {
        setDataMessage(getDashboardBackupErrorMessage(parsed.issue, language));
        return;
      }

      setPendingBackup({
        backup: parsed.backup,
        sourceVersion: parsed.sourceVersion,
        fileName: file.name,
        fileSize: file.size
      });
    } catch {
      setDataMessage(language === "id" ? "File backup gagal dibaca." : "The backup file could not be read.");
    } finally {
      setIsReadingBackup(false);
    }
  }

  async function handleRestore() {
    if (!pendingBackup) {
      return;
    }

    const backup = pendingBackup.backup;
    const summary = language === "id"
      ? `${backup.tasks.length} pekerjaan, ${backup.activities.length} aktivitas, ${backup.routines.length} rutinitas, ${backup.notes.length} catatan, dan ${backup.history.length} riwayat akan mengganti semua data saat ini. Backup pengaman akan diunduh terlebih dahulu.`
      : `${backup.tasks.length} work items, ${backup.activities.length} activities, ${backup.routines.length} routines, ${backup.notes.length} notes, and ${backup.history.length} history records will replace all current data. A safety backup will be downloaded first.`;
    const confirmed = await confirm({
      title: language === "id" ? "Restore backup ini?" : "Restore this backup?",
      description: summary,
      confirmLabel: language === "id" ? "Restore data" : "Restore data",
      tone: "danger"
    });

    if (!confirmed) {
      return;
    }

    setIsRestoring(true);
    clearDataMessages();

    try {
      const safetyBackup = await fetchDashboardBackup();
      downloadDashboardBackup(safetyBackup, "youpi-before-restore");
    } catch {
      setDataMessage(
        language === "id"
          ? "Backup pengaman gagal dibuat. Restore dibatalkan dan data tidak diubah."
          : "The safety backup could not be created. Restore was cancelled and no data was changed."
      );
      setIsRestoring(false);
      return;
    }

    try {
      await restoreDashboardBackup(backup);
      setPendingBackup(null);
      showToast({ message: language === "id" ? "Backup berhasil di-restore." : "Backup restored successfully." });
    } catch {
      setDataMessage(language === "id" ? "Backup gagal di-restore." : "Backup restore failed.");
    } finally {
      setIsRestoring(false);
    }
  }

  async function handleResetData() {
    const confirmed = await confirm({
      title: language === "id" ? "Reset semua data?" : "Reset all data?",
      description:
        language === "id"
          ? "Semua pekerjaan, aktivitas, rutinitas, notes, dan history akan dihapus. Pengaturan juga akan kembali ke default."
          : "All work, activities, routines, notes, and history will be removed. Settings will also return to default.",
      confirmLabel: "Reset data",
      tone: "danger"
    });

    if (!confirmed) {
      return;
    }

    setIsResetting(true);
    clearDataMessages();

    try {
      await resetDashboardData();
      setPendingBackup(null);
      showToast({ message: language === "id" ? "Semua data berhasil dikosongkan." : "All data was cleared successfully." });
    } catch {
      setResetMessage(language === "id" ? "Data gagal dikosongkan." : "Failed to clear data.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={language === "id" ? "Pengaturan" : "Settings"}
        title={language === "id" ? "Preferensi YouPi" : "YouPi Preferences"}
        description={language === "id" ? "Atur bahasa, tampilan, backup notes dan data utama, serta reset data. Semua waktu sistem memakai Asia/Jakarta (WIB)." : "Manage language, appearance, notes and core data backups, and data reset. All system time uses Asia/Jakarta (WIB)."}
        language={language}
        timeZone={APP_DEFAULT_TIME_ZONE}
      />

      <form onSubmit={handleSubmit} className="grid gap-5 rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Nama dashboard" : "Dashboard name"}</span>
          <input
            value={settings.dashboardName}
            onChange={(event) => setSettings((current) => ({ ...current, dashboardName: event.target.value }))}
            className={getFieldClassName({ filled: Boolean(settings.dashboardName) })}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Bahasa" : "Language"}</span>
          <select
            value={settings.language}
            onChange={(event) => setSettings((current) => ({ ...current, language: event.target.value as AppLanguage }))}
            className={getFieldClassName({ filled: Boolean(settings.language) })}
          >
            {languages.map((item) => (
              <option key={item} value={item}>
                {item === "id" ? "Indonesia" : "English"}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Tema tampilan" : "Theme"}</span>
          <select
            value={settings.theme}
            onChange={(event) => setSettings((current) => ({ ...current, theme: event.target.value as ThemePreference }))}
            className={getFieldClassName({ filled: Boolean(settings.theme) })}
          >
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {tTheme(theme, language)}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
          {language === "id" ? "Zona waktu aplikasi dikunci ke Asia/Jakarta (WIB) untuk seluruh UI, log, backup, dan laporan." : "The app time zone is fixed to Asia/Jakarta (WIB) for all UI, logs, backups, and reports."}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            <Save className="h-4 w-4" />
            {language === "id" ? "Simpan pengaturan" : "Save settings"}
          </button>
          {saved ? <span className="text-sm font-medium text-teal-700 dark:text-teal-300">{language === "id" ? "Pengaturan tersimpan." : "Settings saved."}</span> : null}
        </div>
      </form>

      <section className="grid gap-4 rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{language === "id" ? "Keamanan Akun" : "Account Security"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{language === "id" ? "Kelola password akun yang digunakan untuk masuk ke YouPi." : "Manage the password used to sign in to YouPi."}</p>
        </div>
        <div>
          <Link href="/settings/change-password" className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
            <KeyRound className="h-4 w-4" />
            {language === "id" ? "Ubah password" : "Change password"}
          </Link>
        </div>
      </section>

      <section className="grid gap-5 rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{language === "id" ? "Backup dan Restore Data" : "Data Backup and Restore"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{language === "id" ? "Kelola salinan pekerjaan, aktivitas, rutinitas, notes, history, dan preferensi pribadi." : "Manage copies of work, activities, routines, notes, history, and personal preferences."}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="min-w-0 border-b border-slate-200 pb-5 dark:border-slate-700 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{language === "id" ? "Buat backup" : "Create backup"}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{language === "id" ? "Unduh seluruh data YouPi dalam satu file JSON." : "Download all YouPi data in one JSON file."}</p>
            <button
              type="button"
              onClick={handleExport}
              disabled={dataActionInProgress}
              className="mt-4 inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? (language === "id" ? "Membuat backup..." : "Creating backup...") : (language === "id" ? "Unduh backup" : "Download backup")}
            </button>
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{language === "id" ? "Restore backup" : "Restore backup"}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{language === "id" ? "Pilih backup JSON versi 1-6 dengan ukuran maksimal 25 MB." : "Select a version 1-6 JSON backup up to 25 MB."}</p>
            <label className={cn(
              "mt-4 inline-flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
              dataActionInProgress && "pointer-events-none cursor-not-allowed opacity-60"
            )}>
              {isReadingBackup ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isReadingBackup ? (language === "id" ? "Memeriksa file..." : "Checking file...") : pendingBackup ? (language === "id" ? "Pilih file lain" : "Choose another file") : (language === "id" ? "Pilih file backup" : "Choose backup file")}
              <input type="file" accept="application/json,.json" onChange={handleImport} disabled={dataActionInProgress} className="sr-only" />
            </label>

            {pendingBackup ? (
              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                <div className="flex min-w-0 items-start gap-3">
                  <FileJson className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={pendingBackup.fileName}>{pendingBackup.fileName}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatFileSize(pendingBackup.fileSize, language)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPendingBackup(null); clearDataMessages(); }}
                    disabled={dataActionInProgress}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label={language === "id" ? "Hapus pilihan backup" : "Clear selected backup"}
                    title={language === "id" ? "Hapus pilihan" : "Clear selection"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{language === "id" ? "Versi file" : "File version"}</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">v{pendingBackup.sourceVersion}</dd>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{language === "id" ? "Dibuat" : "Created"}</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{pendingExportedAt}</dd>
                  </div>
                </dl>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-200 py-3 text-sm dark:border-slate-700 sm:grid-cols-5">
                  {[
                    [language === "id" ? "Pekerjaan" : "Work", pendingBackup.backup.tasks.length],
                    [language === "id" ? "Aktivitas" : "Activities", pendingBackup.backup.activities.length],
                    [language === "id" ? "Rutinitas" : "Routines", pendingBackup.backup.routines.length],
                    [language === "id" ? "Catatan" : "Notes", pendingBackup.backup.notes.length],
                    [language === "id" ? "Riwayat" : "History", pendingBackup.backup.history.length]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{value}</dd>
                    </div>
                  ))}
                </dl>

                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={dataActionInProgress}
                  className="mt-4 inline-flex items-center gap-2 rounded bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRestoring ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isRestoring ? (language === "id" ? "Memulihkan data..." : "Restoring data...") : (language === "id" ? "Restore data" : "Restore data")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {dataMessage ? <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">{dataMessage}</p> : null}
      </section>

      <section className="grid gap-4 rounded border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-900 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{language === "id" ? "Reset Data" : "Reset Data"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{language === "id" ? "Kosongkan seluruh data dan kembalikan preferensi ke pengaturan awal." : "Clear all data and restore preferences to their defaults."}</p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleResetData}
            disabled={dataActionInProgress}
            className="inline-flex items-center gap-2 rounded border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/50"
          >
            {isResetting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {isResetting ? (language === "id" ? "Mereset data..." : "Resetting data...") : "Reset data"}
          </button>
        </div>
        {resetMessage ? <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">{resetMessage}</p> : null}
      </section>
    </div>
  );
}
