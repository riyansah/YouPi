export type TaskStatus = "Berjalan" | "Selesai" | "Tertunda" | "Dibatalkan";
export type TaskPriority = "Rendah" | "Sedang" | "Tinggi";
export type Weekday = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";

export type ActivityCategory =
  | "Kerja"
  | "Belajar"
  | "Olahraga"
  | "Istirahat"
  | "Meeting"
  | "Project Pribadi"
  | "Lainnya";

export type ActivityStatus = "Direncanakan" | "Berjalan" | "Selesai" | "Tertunda";
export type ReportPeriod = "Harian" | "Mingguan" | "Bulanan";
export type ThemePreference = "Terang" | "Gelap" | "Sistem";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  deadline: string;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  date: string;
  startTime: string;
  endTime: string;
  status: ActivityStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Routine {
  id: string;
  title: string;
  days: Weekday[];
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSettings {
  dashboardName: string;
  theme: ThemePreference;
  preferredCategories: ActivityCategory[];
}

export interface TaskSummary {
  total: number;
  running: number;
  completed: number;
  pending: number;
  canceled: number;
  overdue: number;
  completionRate: number;
}

export interface ActivitySummary {
  total: number;
  today: number;
  dominantCategory: ActivityCategory | "-";
  mostFrequentActivity: string;
}

export const taskStatuses: TaskStatus[] = ["Berjalan", "Selesai", "Tertunda", "Dibatalkan"];
export const taskPriorities: TaskPriority[] = ["Rendah", "Sedang", "Tinggi"];
export const weekdays: Weekday[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const activityCategories: ActivityCategory[] = [
  "Kerja",
  "Belajar",
  "Olahraga",
  "Istirahat",
  "Meeting",
  "Project Pribadi",
  "Lainnya"
];
export const activityStatuses: ActivityStatus[] = ["Direncanakan", "Berjalan", "Selesai", "Tertunda"];
