"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Save } from "lucide-react";
import { useAppFeedback } from "@/components/AppFeedback";
import { ActivityList } from "@/components/ActivityList";
import { Pagination } from "@/components/Pagination";
import { TimePicker } from "@/components/TimePicker";
import { getActivityCategoryFilterParam, matchesActivityCategoryFilter } from "@/lib/activity-filters";
import type { ActivityCategoryFilter } from "@/lib/activity-filters";
import { useDashboardStore } from "@/lib/dashboard-store";
import type { Activity, ActivityCategory, ActivityStatus } from "@/lib/types";
import { activityCategories, activityStatuses } from "@/lib/types";
import { makeId, nowIso, paginateItems, todayDate } from "@/lib/utils";
import { validateActivityForm } from "@/lib/validation";

const pageSize = 10;

const emptyActivityForm = {
  title: "",
  category: "Kerja" as ActivityCategory,
  date: todayDate(),
  startTime: "09:00",
  endTime: "10:00",
  status: "Direncanakan" as ActivityStatus,
  notes: ""
};

function getDateFilterParam(value: string | null) {
  return value && value.length === 10 && value[4] === "-" && value[7] === "-" ? value : null;
}

function ActivitiesPageContent() {
  const { activities, setActivities, settings } = useDashboardStore();
  const { confirm, showToast } = useAppFeedback();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedActivityId = searchParams.get("activityId");
  const categoryQuery = getActivityCategoryFilterParam(searchParams.get("category"));
  const dateQuery = getDateFilterParam(searchParams.get("date"));
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategoryFilter>(
    () => categoryQuery || (settings.preferredCategories.length ? "Preferensi" : "Semua")
  );
  const [dateFilter, setDateFilter] = useState(() => dateQuery || todayDate());
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyActivityForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const filteredActivities = useMemo(
    () =>
      activities
        .filter((activity) => {
          const categoryMatch = matchesActivityCategoryFilter(activity.category, categoryFilter, settings.preferredCategories);
          const dateMatch = !dateFilter || activity.date === dateFilter;
          return categoryMatch && dateMatch;
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities, categoryFilter, dateFilter, settings.preferredCategories]
  );

  const paginatedActivities = useMemo(() => paginateItems(filteredActivities, currentPage, pageSize), [currentPage, filteredActivities]);

  useEffect(() => {
    if (selectedActivityId) {
      return;
    }

    if (categoryQuery && categoryFilter !== categoryQuery) {
      setCategoryFilter(categoryQuery);
    }

    if (dateQuery && dateFilter !== dateQuery) {
      setDateFilter(dateQuery);
    }
  }, [categoryFilter, categoryQuery, dateFilter, dateQuery, selectedActivityId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, dateFilter]);

  useEffect(() => {
    if (currentPage !== paginatedActivities.currentPage) {
      setCurrentPage(paginatedActivities.currentPage);
    }
  }, [currentPage, paginatedActivities.currentPage]);

  useEffect(() => {
    if (!selectedActivityId) {
      return;
    }

    const activity = activities.find((item) => item.id === selectedActivityId);

    if (!activity) {
      return;
    }

    if (categoryFilter !== "Semua") {
      setCategoryFilter("Semua");
      return;
    }

    if (dateFilter !== activity.date) {
      setDateFilter(activity.date);
      return;
    }

    const orderedActivities = activities.filter((item) => item.date === activity.date).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const targetIndex = orderedActivities.findIndex((item) => item.id === activity.id);
    const targetPage = Math.floor(targetIndex / pageSize) + 1;

    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
      return;
    }

    if (editingId !== activity.id) {
      setEditingId(activity.id);
      setForm({
        title: activity.title,
        category: activity.category,
        date: activity.date,
        startTime: activity.startTime,
        endTime: activity.endTime,
        status: activity.status,
        notes: activity.notes
      });
      setFormErrors([]);
    }

    router.replace("/activities", { scroll: false });
  }, [activities, categoryFilter, currentPage, dateFilter, editingId, router, selectedActivityId]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyActivityForm, date: todayDate() });
    setFormErrors([]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateActivityForm(form);

    if (errors.length) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);
    const timestamp = nowIso();

    if (editingId) {
      setActivities((current) =>
        current.map((activity) =>
          activity.id === editingId
            ? {
                ...activity,
                ...form,
                updatedAt: timestamp
              }
            : activity
        )
      );
    } else {
      const activity: Activity = {
        id: makeId("activity"),
        ...form,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      setActivities((current) => [activity, ...current]);
      showToast({ message: `Aktivitas "${activity.title}" berhasil ditambahkan.` });
    }

    resetForm();
  }

  function handleEdit(activity: Activity) {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      category: activity.category,
      date: activity.date,
      startTime: activity.startTime,
      endTime: activity.endTime,
      status: activity.status,
      notes: activity.notes
    });
  }

  async function handleDelete(id: string) {
    const activity = activities.find((item) => item.id === id);
    const confirmed = await confirm({
      title: "Hapus aktivitas?",
      description: `Aktivitas \"${activity?.title || "ini"}\" akan dihapus permanen dari dashboard.`,
      confirmLabel: "Hapus",
      tone: "danger"
    });

    if (!confirmed) {
      return;
    }

    setActivities((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
    showToast({ message: `Aktivitas "${activity?.title || "ini"}" berhasil dihapus.` });
  }

  function handleStatusChange(id: string, status: ActivityStatus) {
    const activity = activities.find((item) => item.id === id);
    const justCompleted = activity && activity.status !== "Selesai" && status === "Selesai";
    const timestamp = nowIso();
    setActivities((current) => current.map((item) => (item.id === id ? { ...item, status, updatedAt: timestamp } : item)));

    if (justCompleted) {
      showToast({ message: `Aktivitas "${activity.title}" diselesaikan.` });
    }
  }

  function handleComplete(id: string) {
    handleStatusChange(id, "Selesai");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Aktivitas Harian</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">Catatan Aktivitas</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola aktivitas berdasarkan tanggal, kategori, dan status.</p>
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-700 dark:text-teal-300" />
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{editingId ? "Edit Aktivitas" : "Tambah Aktivitas"}</h2>
        </div>
        {formErrors.length ? (
          <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
            {formErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Judul</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Kategori</span>
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ActivityCategory }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {activityCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Tanggal</span>
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ActivityStatus }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {activityStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <TimePicker id="activity-start-time" label="Mulai" value={form.startTime} onChange={(startTime) => setForm((current) => ({ ...current, startTime }))} />
          <TimePicker id="activity-end-time" label="Selesai" value={form.endTime} onChange={(endTime) => setForm((current) => ({ ...current, endTime }))} />
          <label className="space-y-1 lg:col-span-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Catatan</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Save className="h-4 w-4" />
              {editingId ? "Simpan perubahan" : "Tambah aktivitas"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Filter tanggal</span>
          <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Filter kategori</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as ActivityCategoryFilter)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="Preferensi">Preferensi</option>
            <option value="Semua">Semua</option>
            {activityCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {categoryFilter === "Preferensi" ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.preferredCategories.length
                ? `Menampilkan kategori preferensi: ${settings.preferredCategories.join(", ")}. Filter tanggal tetap berlaku.`
                : "Belum ada kategori preferensi dipilih di Pengaturan."}
            </p>
          ) : null}
        </label>
      </section>

      <ActivityList activities={paginatedActivities.items} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} onComplete={handleComplete} />
      <Pagination
        currentPage={paginatedActivities.currentPage}
        totalPages={paginatedActivities.totalPages}
        totalItems={paginatedActivities.totalItems}
        startItem={paginatedActivities.startItem}
        endItem={paginatedActivities.endItem}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={null}>
      <ActivitiesPageContent />
    </Suspense>
  );
}
