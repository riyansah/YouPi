import type { Activity, DashboardSettings, Routine, Task } from "@/lib/types";

export const taskStorageKey = "personal-dashboard-tasks";
export const activityStorageKey = "personal-dashboard-activities";
export const routineStorageKey = "personal-dashboard-routines";
export const settingsStorageKey = "personal-dashboard-settings";

export const defaultTasks: Task[] = [
  {
    id: "task-1",
    title: "Rancang prioritas minggu ini",
    description: "Susun fokus pekerjaan utama dan target penyelesaian mingguan.",
    status: "Berjalan",
    priority: "Tinggi",
    startDate: "2026-06-22",
    deadline: "2026-06-28",
    completedAt: null,
    createdAt: "2026-06-22T08:00:00.000Z",
    updatedAt: "2026-06-22T08:00:00.000Z"
  },
  {
    id: "task-2",
    title: "Review dokumen proyek",
    description: "Periksa catatan keputusan dan daftar risiko proyek pribadi.",
    status: "Selesai",
    priority: "Sedang",
    startDate: "2026-06-20",
    deadline: "2026-06-23",
    completedAt: "2026-06-23T10:30:00.000Z",
    createdAt: "2026-06-20T09:00:00.000Z",
    updatedAt: "2026-06-23T10:30:00.000Z"
  },
  {
    id: "task-3",
    title: "Rapikan backlog ide",
    description: "Kelompokkan ide ke kategori kerja, belajar, dan project pribadi.",
    status: "Tertunda",
    priority: "Rendah",
    startDate: "2026-06-18",
    deadline: "2026-06-24",
    completedAt: null,
    createdAt: "2026-06-18T13:00:00.000Z",
    updatedAt: "2026-06-21T11:00:00.000Z"
  },
  {
    id: "task-4",
    title: "Finalisasi laporan harian",
    description: "Buat ringkasan pekerjaan selesai dan aktivitas penting hari ini.",
    status: "Berjalan",
    priority: "Sedang",
    startDate: "2026-06-23",
    deadline: "2026-06-23",
    completedAt: null,
    createdAt: "2026-06-23T07:30:00.000Z",
    updatedAt: "2026-06-23T07:30:00.000Z"
  },
  {
    id: "task-5",
    title: "Susun template laporan mingguan",
    description: "Buat format ringkasan mingguan untuk pekerjaan, aktivitas, dan hambatan.",
    status: "Selesai",
    priority: "Tinggi",
    startDate: "2026-06-17",
    deadline: "2026-06-21",
    completedAt: "2026-06-21T15:00:00.000Z",
    createdAt: "2026-06-17T09:15:00.000Z",
    updatedAt: "2026-06-21T15:00:00.000Z"
  },
  {
    id: "task-6",
    title: "Evaluasi rutinitas pagi",
    description: "Tinjau kebiasaan pagi yang paling membantu fokus kerja harian.",
    status: "Tertunda",
    priority: "Sedang",
    startDate: "2026-06-19",
    deadline: "2026-06-25",
    completedAt: null,
    createdAt: "2026-06-19T06:45:00.000Z",
    updatedAt: "2026-06-22T08:10:00.000Z"
  },
  {
    id: "task-7",
    title: "Buat daftar ide project pribadi",
    description: "Kumpulkan ide project kecil yang bisa dikerjakan dalam dua minggu.",
    status: "Berjalan",
    priority: "Rendah",
    startDate: "2026-06-21",
    deadline: "2026-06-30",
    completedAt: null,
    createdAt: "2026-06-21T12:20:00.000Z",
    updatedAt: "2026-06-23T09:00:00.000Z"
  },
  {
    id: "task-8",
    title: "Batalkan eksperimen workflow lama",
    description: "Hentikan workflow yang tidak efektif agar tidak mengganggu prioritas baru.",
    status: "Dibatalkan",
    priority: "Rendah",
    startDate: "2026-06-15",
    deadline: "2026-06-20",
    completedAt: null,
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-20T16:30:00.000Z"
  }
];

export const defaultActivities: Activity[] = [
  {
    id: "activity-1",
    title: "Deep work dashboard",
    category: "Kerja",
    date: "2026-06-23",
    startTime: "09:00",
    endTime: "10:30",
    status: "Selesai",
    notes: "Fokus pada layout dan struktur data.",
    createdAt: "2026-06-23T08:45:00.000Z",
    updatedAt: "2026-06-23T10:30:00.000Z"
  },
  {
    id: "activity-2",
    title: "Belajar TypeScript utility types",
    category: "Belajar",
    date: "2026-06-23",
    startTime: "11:00",
    endTime: "12:00",
    status: "Berjalan",
    notes: "Catat pola yang bisa dipakai ulang.",
    createdAt: "2026-06-23T10:50:00.000Z",
    updatedAt: "2026-06-23T10:50:00.000Z"
  },
  {
    id: "activity-3",
    title: "Meeting sinkronisasi",
    category: "Meeting",
    date: "2026-06-22",
    startTime: "14:00",
    endTime: "14:45",
    status: "Selesai",
    notes: "Bahas status pekerjaan berjalan.",
    createdAt: "2026-06-22T13:50:00.000Z",
    updatedAt: "2026-06-22T14:45:00.000Z"
  },
  {
    id: "activity-4",
    title: "Olahraga ringan",
    category: "Olahraga",
    date: "2026-06-21",
    startTime: "17:30",
    endTime: "18:00",
    status: "Selesai",
    notes: "Jalan cepat 30 menit.",
    createdAt: "2026-06-21T17:20:00.000Z",
    updatedAt: "2026-06-21T18:00:00.000Z"
  },
  {
    id: "activity-5",
    title: "Planning pekerjaan pagi",
    category: "Kerja",
    date: "2026-06-23",
    startTime: "08:15",
    endTime: "08:45",
    status: "Selesai",
    notes: "Tentukan tiga prioritas utama sebelum mulai kerja.",
    createdAt: "2026-06-23T08:00:00.000Z",
    updatedAt: "2026-06-23T08:45:00.000Z"
  },
  {
    id: "activity-6",
    title: "Review pull request",
    category: "Kerja",
    date: "2026-06-23",
    startTime: "13:00",
    endTime: "14:00",
    status: "Direncanakan",
    notes: "Cek perubahan kecil dan catat risiko regresi.",
    createdAt: "2026-06-23T11:30:00.000Z",
    updatedAt: "2026-06-23T11:30:00.000Z"
  },
  {
    id: "activity-7",
    title: "Istirahat siang",
    category: "Istirahat",
    date: "2026-06-23",
    startTime: "12:00",
    endTime: "12:45",
    status: "Direncanakan",
    notes: "Jeda makan dan lepas layar.",
    createdAt: "2026-06-23T08:10:00.000Z",
    updatedAt: "2026-06-23T08:10:00.000Z"
  },
  {
    id: "activity-8",
    title: "Riset struktur dashboard",
    category: "Project Pribadi",
    date: "2026-06-23",
    startTime: "15:00",
    endTime: "16:30",
    status: "Direncanakan",
    notes: "Cari pola layout yang cocok untuk penggunaan harian.",
    createdAt: "2026-06-23T12:10:00.000Z",
    updatedAt: "2026-06-23T12:10:00.000Z"
  },
  {
    id: "activity-9",
    title: "Catatan akhir hari",
    category: "Lainnya",
    date: "2026-06-23",
    startTime: "17:00",
    endTime: "17:30",
    status: "Direncanakan",
    notes: "Tulis ringkasan singkat dan rencana besok.",
    createdAt: "2026-06-23T12:20:00.000Z",
    updatedAt: "2026-06-23T12:20:00.000Z"
  },
  {
    id: "activity-10",
    title: "Belajar Recharts",
    category: "Belajar",
    date: "2026-06-22",
    startTime: "10:00",
    endTime: "11:15",
    status: "Selesai",
    notes: "Pelajari pie chart, bar chart, dan responsive container.",
    createdAt: "2026-06-22T09:45:00.000Z",
    updatedAt: "2026-06-22T11:15:00.000Z"
  },
  {
    id: "activity-11",
    title: "Sinkronisasi backlog",
    category: "Meeting",
    date: "2026-06-22",
    startTime: "15:30",
    endTime: "16:15",
    status: "Selesai",
    notes: "Prioritaskan pekerjaan yang berdampak langsung minggu ini.",
    createdAt: "2026-06-22T15:00:00.000Z",
    updatedAt: "2026-06-22T16:15:00.000Z"
  },
  {
    id: "activity-12",
    title: "Rapikan catatan belajar",
    category: "Belajar",
    date: "2026-06-22",
    startTime: "19:00",
    endTime: "19:45",
    status: "Selesai",
    notes: "Pindahkan catatan penting ke format yang lebih mudah dicari.",
    createdAt: "2026-06-22T18:55:00.000Z",
    updatedAt: "2026-06-22T19:45:00.000Z"
  },
  {
    id: "activity-13",
    title: "Deep work laporan",
    category: "Kerja",
    date: "2026-06-21",
    startTime: "09:30",
    endTime: "11:00",
    status: "Selesai",
    notes: "Susun outline laporan produktivitas mingguan.",
    createdAt: "2026-06-21T09:20:00.000Z",
    updatedAt: "2026-06-21T11:00:00.000Z"
  },
  {
    id: "activity-14",
    title: "Istirahat sore",
    category: "Istirahat",
    date: "2026-06-21",
    startTime: "15:00",
    endTime: "15:30",
    status: "Selesai",
    notes: "Jeda singkat setelah sesi fokus.",
    createdAt: "2026-06-21T14:55:00.000Z",
    updatedAt: "2026-06-21T15:30:00.000Z"
  },
  {
    id: "activity-15",
    title: "Brainstorm project pribadi",
    category: "Project Pribadi",
    date: "2026-06-20",
    startTime: "20:00",
    endTime: "21:00",
    status: "Selesai",
    notes: "Pilih ide yang realistis untuk tahap berikutnya.",
    createdAt: "2026-06-20T19:50:00.000Z",
    updatedAt: "2026-06-20T21:00:00.000Z"
  },
  {
    id: "activity-16",
    title: "Workout mobility",
    category: "Olahraga",
    date: "2026-06-20",
    startTime: "07:00",
    endTime: "07:35",
    status: "Selesai",
    notes: "Latihan mobilitas ringan sebelum kerja.",
    createdAt: "2026-06-20T06:50:00.000Z",
    updatedAt: "2026-06-20T07:35:00.000Z"
  },
  {
    id: "activity-17",
    title: "Review agenda mingguan",
    category: "Kerja",
    date: "2026-06-19",
    startTime: "16:00",
    endTime: "16:45",
    status: "Selesai",
    notes: "Tandai pekerjaan yang perlu dibawa ke minggu depan.",
    createdAt: "2026-06-19T15:45:00.000Z",
    updatedAt: "2026-06-19T16:45:00.000Z"
  },
  {
    id: "activity-18",
    title: "Baca dokumentasi Next.js",
    category: "Belajar",
    date: "2026-06-19",
    startTime: "10:30",
    endTime: "11:30",
    status: "Selesai",
    notes: "Fokus pada App Router dan client components.",
    createdAt: "2026-06-19T10:20:00.000Z",
    updatedAt: "2026-06-19T11:30:00.000Z"
  },
  {
    id: "activity-19",
    title: "Meeting evaluasi sprint pribadi",
    category: "Meeting",
    date: "2026-06-18",
    startTime: "13:00",
    endTime: "13:45",
    status: "Selesai",
    notes: "Bahas apa yang perlu dihentikan dan dilanjutkan.",
    createdAt: "2026-06-18T12:50:00.000Z",
    updatedAt: "2026-06-18T13:45:00.000Z"
  },
  {
    id: "activity-20",
    title: "Jurnal refleksi",
    category: "Lainnya",
    date: "2026-06-18",
    startTime: "21:00",
    endTime: "21:20",
    status: "Selesai",
    notes: "Catat pola energi dan hambatan harian.",
    createdAt: "2026-06-18T20:55:00.000Z",
    updatedAt: "2026-06-18T21:20:00.000Z"
  }
];


export const defaultRoutines: Routine[] = [
  {
    id: "routine-1",
    title: "Review agenda pagi",
    days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    startTime: "07:30",
    endTime: "08:00",
    priority: "Tinggi",
    notes: "Cek prioritas utama sebelum mulai kerja.",
    createdAt: "2026-06-20T06:00:00.000Z",
    updatedAt: "2026-06-20T06:00:00.000Z"
  },
  {
    id: "routine-2",
    title: "Istirahat siang terjadwal",
    days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    startTime: "12:00",
    endTime: "12:30",
    priority: "Sedang",
    notes: "Jeda makan dan lepas layar.",
    createdAt: "2026-06-20T06:10:00.000Z",
    updatedAt: "2026-06-20T06:10:00.000Z"
  },
  {
    id: "routine-3",
    title: "Olahraga akhir pekan",
    days: ["Sabtu", "Minggu"],
    startTime: "07:00",
    endTime: "07:45",
    priority: "Sedang",
    notes: "Sesi ringan untuk menjaga ritme tubuh.",
    createdAt: "2026-06-20T06:20:00.000Z",
    updatedAt: "2026-06-20T06:20:00.000Z"
  },
  {
    id: "routine-4",
    title: "Catatan penutup hari",
    days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    startTime: "17:30",
    endTime: "17:45",
    priority: "Rendah",
    notes: "Tuliskan evaluasi singkat dan rencana besok.",
    createdAt: "2026-06-20T06:30:00.000Z",
    updatedAt: "2026-06-20T06:30:00.000Z"
  }
];

export const defaultSettings: DashboardSettings = {
  dashboardName: "Dashboard Aktivitas Pribadi",
  theme: "Terang",
  preferredCategories: ["Kerja", "Belajar", "Project Pribadi"],
  accountName: "Pengguna Lokal",
  accountEmail: "local@example.com"
};
