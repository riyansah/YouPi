export type TaskStatus = "Akan Datang" | "Berjalan" | "Selesai" | "Tertunda" | "Dibatalkan";
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

export type ActivityStatus = "Akan Datang" | "Direncanakan" | "Berjalan" | "Selesai" | "Tertunda" | "Dibatalkan";
export type ReportPeriod = "Harian" | "Mingguan" | "Bulanan";
export type ThemePreference = "Terang" | "Gelap" | "Sistem";
export type AppLanguage = "en" | "id";
export type ScheduleSource = "work" | "activity" | "routine";
export type ScheduleDisplayStatus = "upcoming" | "done" | "missed" | "cancelled";
export type ScheduleViewMode = "today" | "week" | "month" | "agenda";
export type ScheduleSourceFilter = "all" | ScheduleSource;
export type ScheduleStatusFilter = "all" | Exclude<ScheduleDisplayStatus, "cancelled">;
export type NoteCategory = "work" | "activity" | "routine" | "personal";
export type NoteLinkedType = "work" | "activity" | "routine" | null;
export type HistoryEventType = "created" | "updated" | "completed" | "missed" | "cancelled" | "deleted" | "pinned" | "unpinned";
export type HistoryEntityType = "work" | "activity" | "routine" | "note";

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

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  linkedType: NoteLinkedType;
  linkedId: string | null;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSettings {
  dashboardName: string;
  theme: ThemePreference;
  preferredCategories: ActivityCategory[];
  language: AppLanguage;
  timeZone: string;
}

export interface HistoryEvent {
  id: string;
  eventType: HistoryEventType;
  entityType: HistoryEntityType;
  entityId: string;
  title: string;
  description: string;
  metadata: string | null;
  createdAt: string;
}

export interface HistoryLinkedItem {
  exists: boolean;
  href: string | null;
  label: string | null;
}

export interface HistoryEventRecord extends HistoryEvent {
  linkedItem: HistoryLinkedItem;
}

export interface TaskSummary {
  total: number;
  upcoming: number;
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

export interface ScheduleItem {
  id: string;
  source: ScheduleSource;
  sourceId: string;
  title: string;
  category: string;
  detailCategory: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  displayStatus: ScheduleDisplayStatus;
  priority: TaskPriority | null;
  reminder: string | null;
  href: string;
  sourceStatus: string | null;
  deadline: string | null;
  notes: string | null;
  isAllDay: boolean;
  sortStartTimestamp: number;
  sortEndTimestamp: number;
}

export const taskStatuses: TaskStatus[] = ["Akan Datang", "Berjalan", "Selesai", "Tertunda", "Dibatalkan"];
export const taskFormStatuses: TaskStatus[] = ["Akan Datang", "Berjalan", "Selesai", "Tertunda"];
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
export const activityStatuses: ActivityStatus[] = ["Akan Datang", "Direncanakan", "Berjalan", "Selesai", "Tertunda", "Dibatalkan"];
export const activityFormStatuses: ActivityStatus[] = ["Akan Datang", "Direncanakan", "Berjalan", "Selesai", "Tertunda"];
