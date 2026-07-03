"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { Download, KeyRound, RotateCcw, Save, Upload } from "lucide-react";
import { useDashboardStore } from "@/lib/dashboard-store";
import { defaultSettings } from "@/lib/data";
import { createDashboardBackup, parseDashboardBackup } from "@/lib/storage";
import type { ActivityCategory, ThemePreference } from "@/lib/types";
import { activityCategories } from "@/lib/types";

const themes: ThemePreference[] = ["Terang", "Gelap", "Sistem"];

export default function SettingsPage() {
  const { tasks, activities, routines, settings, setSettings, replaceDashboardData } = useDashboardStore();
  const [saved, setSaved] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);

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
        preferredCategories: exists
          ? current.preferredCategories.filter((item) => item !== category)
          : [...current.preferredCategories, category]
      };
    });
  }

  function handleExport() {
    const backup = createDashboardBackup(tasks, activities, routines, settings);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `personal-activity-dashboard-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDataMessage("Backup JSON berhasil dibuat.");
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

    if (!window.confirm("Impor backup akan mengganti semua data dashboard saat ini. Lanjutkan?")) {
      return;
    }

    try {
      await replaceDashboardData({
        tasks: parsed.backup.tasks,
        activities: parsed.backup.activities,
        routines: parsed.backup.routines,
        settings: parsed.backup.settings
      });
      setDataMessage("Backup berhasil diimpor.");
    } catch {
      setDataMessage("Backup gagal diimpor.");
    }
  }

  async function handleResetData() {
    if (!window.confirm("Hapus semua pekerjaan, aktivitas, dan rutinitas? Pengaturan akan kembali ke default.")) {
      return;
    }

    try {
      await replaceDashboardData({ tasks: [], activities: [], routines: [], settings: defaultSettings });
      setDataMessage("Semua data berhasil dikosongkan.");
    } catch {
      setDataMessage("Data gagal dikosongkan.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Pengaturan</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Preferensi Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Atur tampilan, kategori bawaan aktivitas, backup, dan reset data.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 rounded border border-slate-200 bg-white p-5 shadow-sm">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Nama dashboard</span>
          <input
            value={settings.dashboardName}
            onChange={(event) => setSettings((current) => ({ ...current, dashboardName: event.target.value }))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Tema tampilan</span>
          <select
            value={settings.theme}
            onChange={(event) => setSettings((current) => ({ ...current, theme: event.target.value as ThemePreference }))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Preferensi kategori aktivitas</legend>
          <p className="text-sm text-slate-500">Kategori pilihan dipakai oleh filter Preferensi di menu Aktivitas.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activityCategories.map((category) => (
              <label key={category} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.preferredCategories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="h-4 w-4 accent-teal-700"
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Save className="h-4 w-4" />
            Simpan pengaturan
          </button>
          {saved ? <span className="text-sm font-medium text-teal-700">Pengaturan tersimpan.</span> : null}
        </div>
      </form>

      <section className="grid gap-4 rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Keamanan Akun</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola password akun yang digunakan untuk masuk ke dashboard.</p>
        </div>
        <div>
          <Link
            href="/settings/change-password"
            className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <KeyRound className="h-4 w-4" />
            Ubah password
          </Link>
        </div>
      </section>

      <section className="grid gap-4 rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Backup Data</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola salinan data pekerjaan, aktivitas, rutinitas, dan preferensi pribadi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <Upload className="h-4 w-4" />
            Import JSON
            <input type="file" accept="application/json,.json" onChange={handleImport} className="sr-only" />
          </label>
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-2 rounded border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset data
          </button>
        </div>
        {dataMessage ? <p className="text-sm font-medium text-teal-700">{dataMessage}</p> : null}
      </section>
    </div>
  );
}
