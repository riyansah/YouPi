import { useEffect, useState } from "react";
import type {
  ActivityCategory,
  ActivityStatus,
  AppLanguage,
  ReportPeriod,
  TaskPriority,
  TaskStatus,
  ThemePreference,
  Weekday
} from "@/lib/types";

export const BRAND_NAME = "YouPi";
export const BRAND_TAGLINE = "You Plan It";
export const BRAND_DESCRIPTION = "Personal Activity Management Dashboard";
export const LANGUAGE_STORAGE_KEY = "youpi-language";

export function useStoredLanguage(defaultLanguage: AppLanguage = "en") {
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage);

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (stored === "en" || stored === "id") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return [language, setLanguage] as const;
}

export function getLocale(language: AppLanguage) {
  return language === "id" ? "id-ID" : "en-US";
}

export function tRoute(href: string, language: AppLanguage) {
  const labels: Record<string, { en: string; id: string }> = {
    "/dashboard": { en: "Dashboard", id: "Dashboard" },
    "/tasks": { en: "Work", id: "Pekerjaan" },
    "/activities": { en: "Activities", id: "Aktivitas" },
    "/routines": { en: "Routines", id: "Rutinitas" },
    "/schedule": { en: "Schedule", id: "Jadwal" },
    "/notes": { en: "Notes", id: "Catatan" },
    "/history": { en: "History", id: "Riwayat" },
    "/reports": { en: "Reports", id: "Laporan" },
    "/settings": { en: "Settings", id: "Pengaturan" }
  };

  const label = labels[href];
  return label ? label[language] : href;
}

export function tTaskStatus(value: TaskStatus, language: AppLanguage) {
  const labels: Record<TaskStatus, { en: string; id: string }> = {
    "Akan Datang": { en: "Upcoming", id: "Akan Datang" },
    Berjalan: { en: "In Progress", id: "Berjalan" },
    Selesai: { en: "Completed", id: "Selesai" },
    Tertunda: { en: "Pending", id: "Tertunda" },
    Dibatalkan: { en: "Canceled", id: "Dibatalkan" }
  };

  return labels[value][language];
}

export function tActivityStatus(value: ActivityStatus, language: AppLanguage) {
  const labels: Record<ActivityStatus, { en: string; id: string }> = {
    "Akan Datang": { en: "Upcoming", id: "Akan Datang" },
    Direncanakan: { en: "Planned", id: "Direncanakan" },
    Berjalan: { en: "In Progress", id: "Berjalan" },
    Selesai: { en: "Completed", id: "Selesai" },
    Tertunda: { en: "Pending", id: "Tertunda" },
    Dibatalkan: { en: "Canceled", id: "Dibatalkan" }
  };

  return labels[value][language];
}

export function tPriority(value: TaskPriority, language: AppLanguage) {
  const labels: Record<TaskPriority, { en: string; id: string }> = {
    Rendah: { en: "Low", id: "Rendah" },
    Sedang: { en: "Medium", id: "Sedang" },
    Tinggi: { en: "High", id: "Tinggi" }
  };

  return labels[value][language];
}

export function tWeekday(value: Weekday, language: AppLanguage) {
  const labels: Record<Weekday, { en: string; id: string }> = {
    Senin: { en: "Monday", id: "Senin" },
    Selasa: { en: "Tuesday", id: "Selasa" },
    Rabu: { en: "Wednesday", id: "Rabu" },
    Kamis: { en: "Thursday", id: "Kamis" },
    Jumat: { en: "Friday", id: "Jumat" },
    Sabtu: { en: "Saturday", id: "Sabtu" },
    Minggu: { en: "Sunday", id: "Minggu" }
  };

  return labels[value][language];
}

export function tCategory(value: ActivityCategory, language: AppLanguage) {
  const labels: Record<ActivityCategory, { en: string; id: string }> = {
    Kerja: { en: "Work", id: "Kerja" },
    Belajar: { en: "Study", id: "Belajar" },
    Olahraga: { en: "Exercise", id: "Olahraga" },
    Istirahat: { en: "Rest", id: "Istirahat" },
    Meeting: { en: "Meeting", id: "Meeting" },
    "Project Pribadi": { en: "Personal Project", id: "Project Pribadi" },
    Lainnya: { en: "Other", id: "Lainnya" }
  };

  return labels[value][language];
}

export function tTheme(value: ThemePreference, language: AppLanguage) {
  const labels: Record<ThemePreference, { en: string; id: string }> = {
    Terang: { en: "Light", id: "Terang" },
    Gelap: { en: "Dark", id: "Gelap" },
    Sistem: { en: "System", id: "Sistem" }
  };

  return labels[value][language];
}

export function tPeriod(value: ReportPeriod, language: AppLanguage) {
  const labels: Record<ReportPeriod, { en: string; id: string }> = {
    Harian: { en: "Daily", id: "Harian" },
    Mingguan: { en: "Weekly", id: "Mingguan" },
    Bulanan: { en: "Monthly", id: "Bulanan" },
    Kustom: { en: "Custom", id: "Kustom" }
  };

  return labels[value][language];
}

export function tReportPeriodLabel(value: ReportPeriod, language: AppLanguage) {
  const labels: Record<ReportPeriod, { en: string; id: string }> = {
    Harian: { en: "Today", id: "Hari Ini" },
    Mingguan: { en: "This Week", id: "Minggu Ini" },
    Bulanan: { en: "This Month", id: "Bulan Ini" },
    Kustom: { en: "Custom Range", id: "Rentang Kustom" }
  };

  return labels[value][language];
}

export function tActivityFilter(value: "Semua" | ActivityCategory, language: AppLanguage) {
  if (value === "Semua") {
    return language === "id" ? "Semua" : "All";
  }

  return tCategory(value, language);
}

export function tPasswordStrength(value: "Lemah" | "Sedang" | "Kuat", language: AppLanguage) {
  const labels = {
    Lemah: { en: "Weak", id: "Lemah" },
    Sedang: { en: "Medium", id: "Sedang" },
    Kuat: { en: "Strong", id: "Kuat" }
  } as const;

  return labels[value][language];
}

export function tChartTitle(
  key: "taskStatus" | "activityCategory" | "activityPerDay" | "dailyActivity" | "weeklyProgress",
  language: AppLanguage
) {
  const labels = {
    taskStatus: { en: "Work by Status", id: "Pekerjaan Berdasarkan Status" },
    activityCategory: { en: "Activities by Category", id: "Aktivitas Berdasarkan Kategori" },
    activityPerDay: { en: "Activities per Day", id: "Aktivitas Per Hari" },
    dailyActivity: { en: "Daily Activity Mix", id: "Kegiatan Per Hari" },
    weeklyProgress: { en: "Weekly Progress", id: "Progress Mingguan" }
  } as const;

  return labels[key][language];
}

export function tAgendaType(value: "Aktivitas" | "Rutinitas", language: AppLanguage) {
  return value === "Aktivitas" ? (language === "id" ? "Aktivitas" : "Activity") : language === "id" ? "Rutinitas" : "Routine";
}

export function tAuthErrorCode(code: string | undefined, language: AppLanguage) {
  const labels: Record<string, { en: string; id: string }> = {
    missing_account: { en: "No account exists yet. Please register first.", id: "Belum ada akun. Silakan register terlebih dahulu." },
    locked: { en: "Too many login attempts. Try again after the countdown finishes.", id: "Terlalu banyak percobaan login. Coba lagi setelah hitung mundur selesai." },
    missing_credentials: { en: "Username and password are required.", id: "Username dan password wajib diisi." },
    invalid_credentials: { en: "Incorrect username or password.", id: "Username atau password salah." },
    account_exists: { en: "An account already exists. Please sign in.", id: "Akun sudah dibuat. Silakan login." },
    rate_limited: { en: "Too many registration attempts. Try again in a few minutes.", id: "Terlalu banyak percobaan register. Coba lagi beberapa menit lagi." },
    missing_change_password_fields: { en: "Current password, new password, and confirmation are required.", id: "Password lama, password baru, dan konfirmasi wajib diisi." },
    confirm_mismatch: { en: "New password confirmation does not match.", id: "Konfirmasi password baru tidak sama." },
    same_password: { en: "New password must be different from the current password.", id: "Password baru tidak boleh sama dengan password lama." },
    invalid_current_password: { en: "Current password is incorrect.", id: "Password lama tidak sesuai." },
    change_password_success: { en: "Password changed successfully.", id: "Password berhasil diubah." },
    register_success: { en: "Account created successfully. Please sign in.", id: "Akun berhasil dibuat. Silakan login." }
  };

  return code && labels[code] ? labels[code][language] : null;
}

export type ReportPdfMode = "summary" | "full";

export function tReportPdfMode(value: ReportPdfMode, language: AppLanguage) {
  return value === "full"
    ? language === "id"
      ? "Semua data filter"
      : "All filtered data"
    : language === "id"
      ? "Ringkas + detail penting"
      : "Summary + key details";
}
