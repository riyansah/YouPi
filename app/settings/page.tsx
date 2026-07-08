"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { Download, KeyRound, RotateCcw, Save, Upload } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { PageHeader } from "@/components/PageHeader";
import { useDashboardStore } from "@/lib/dashboard-store";
import { defaultSettings } from "@/lib/data";
import { createDashboardBackup, parseDashboardBackup } from "@/lib/storage";
import { tCategory, tTheme } from "@/lib/i18n";
import { getFieldClassName } from "@/lib/field-styles";
import type { ActivityCategory, AppLanguage, ThemePreference } from "@/lib/types";
import { activityCategories } from "@/lib/types";
import { APP_DEFAULT_TIME_ZONE, getDateKeyFromTimestamp } from "@/lib/time";

const themes: ThemePreference[] = ["Terang", "Gelap", "Sistem"];
const languages: AppLanguage[] = ["en", "id"];

export default function SettingsPage() {
  const { tasks, activities, routines, notes, history, settings, setSettings, replaceDashboardData } = useDashboardStore();
  const { confirm, showToast } = useAppFeedback();
  const [saved, setSaved] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const language = settings.language;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function toggleCategory(category: ActivityCategory) {
    setSettings((current) => {
      const exists = current.preferredCategories.includes(category);
      return {
        ...current,
        preferredCategories: exists ? current.preferredCategories.filter((item) => item !== category) : [...current.preferredCategories, category]
      };
    });
  }

  function handleExport() {
    const backup = createDashboardBackup(tasks, activities, routines, notes, settings, history);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `youpi-${getDateKeyFromTimestamp(backup.exportedAt)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDataMessage(null);
    showToast({ message: language === "id" ? "Backup JSON berhasil dibuat." : "JSON backup created successfully." });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const parsed = parseDashboardBackup(await file.text());

    if (!parsed.ok) {
      setDataMessage(parsed.error);
      return;
    }

    const confirmed = await confirm({
      title: language === "id" ? "Impor backup?" : "Import backup?",
      description:
        language === "id"
          ? "Backup akan mengganti semua data dashboard saat ini dengan isi file yang dipilih."
          : "The backup will replace your current dashboard data with the selected file.",
      confirmLabel: language === "id" ? "Impor" : "Import"
    });

    if (!confirmed) {
      return;
    }

    try {
      await replaceDashboardData({
        tasks: parsed.backup.tasks,
        activities: parsed.backup.activities,
        routines: parsed.backup.routines,
        notes: parsed.backup.notes,
        history: parsed.backup.history,
        settings: parsed.backup.settings
      });
      setDataMessage(null);
      showToast({ message: language === "id" ? "Backup berhasil diimpor." : "Backup imported successfully." });
    } catch {
      setDataMessage(language === "id" ? "Backup gagal diimpor." : "Backup import failed.");
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

    try {
      await replaceDashboardData({ tasks: [], activities: [], routines: [], notes: [], history: [], settings: defaultSettings });
      setDataMessage(null);
      showToast({ message: language === "id" ? "Semua data berhasil dikosongkan." : "All data was cleared successfully." });
    } catch {
      setDataMessage(language === "id" ? "Data gagal dikosongkan." : "Failed to clear data.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={language === "id" ? "Pengaturan" : "Settings"}
        title={language === "id" ? "Preferensi YouPi" : "YouPi Preferences"}
        description={language === "id" ? "Atur bahasa, tampilan, kategori bawaan aktivitas, backup notes dan data utama, serta reset data. Semua waktu sistem memakai Asia/Jakarta (WIB)." : "Manage language, appearance, default activity categories, notes and core data backups, and data reset. All system time uses Asia/Jakarta (WIB)."}
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

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">{language === "id" ? "Preferensi kategori aktivitas" : "Preferred activity categories"}</legend>
          <p className="text-sm text-slate-500 dark:text-slate-400">{language === "id" ? "Kategori pilihan dipakai oleh filter Preferensi di menu Aktivitas." : "Selected categories are used by the Preferences filter in Activities."}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activityCategories.map((category) => (
              <label key={category} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={settings.preferredCategories.includes(category)} onChange={() => toggleCategory(category)} className="h-4 w-4 accent-teal-700" />
                <span>{tCategory(category, language)}</span>
              </label>
            ))}
          </div>
        </fieldset>

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

      <section className="grid gap-4 rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{language === "id" ? "Backup Data" : "Data Backup"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{language === "id" ? "Kelola salinan data pekerjaan, aktivitas, rutinitas, notes, history, dan preferensi pribadi." : "Manage backups for your work, activities, routines, notes, history, and personal preferences."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            <Upload className="h-4 w-4" />
            Import JSON
            <input type="file" accept="application/json,.json" onChange={handleImport} className="sr-only" />
          </label>
          <button type="button" onClick={handleResetData} className="inline-flex items-center gap-2 rounded border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/50">
            <RotateCcw className="h-4 w-4" />
            {language === "id" ? "Reset data" : "Reset data"}
          </button>
        </div>
        {dataMessage ? <p className="text-sm text-rose-600 dark:text-rose-300">{dataMessage}</p> : null}
      </section>
    </div>
  );
}
