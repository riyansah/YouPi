"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Save } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { ActivityList } from "@/components/ActivityList";
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

function ActivitiesPageContent() {
  const { activities, setActivities } = useDashboardStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedActivityId = searchParams.get("activityId");
  const [categoryFilter, setCategoryFilter] = useState<"Semua" | ActivityCategory>("Semua");
  const [dateFilter, setDateFilter] = useState(todayDate());
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyActivityForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const filteredActivities = useMemo(
    () =>
      activities
        .filter((activity) => {
          const categoryMatch = categoryFilter === "Semua" || activity.category === categoryFilter;
          const dateMatch = !dateFilter || activity.date === dateFilter;
          return categoryMatch && dateMatch;
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activities, categoryFilter, dateFilter]
  );

  const paginatedActivities = useMemo(
    () => paginateItems(filteredActivities, currentPage, pageSize),
    [currentPage, filteredActivities]
  );

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

    const orderedActivities = activities
      .filter((item) => item.date === activity.date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
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

  function handleDelete(id: string) {
    const activity = activities.find((item) => item.id === id);

    if (!window.confirm(`Hapus aktivitas "${activity?.title || "ini"}"?`)) {
      return;
    }

    setActivities((current) => current.filter((activity) => activity.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  function handleStatusChange(id: string, status: ActivityStatus) {
    const timestamp = nowIso();
    setActivities((current) =>
      current.map((activity) => (activity.id === id ? { ...activity, status, updatedAt: timestamp } : activity))
    );
  }

  function handleComplete(id: string) {
    handleStatusChange(id, "Selesai");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Aktivitas Harian</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Catatan Aktivitas</h1>
        <p className="mt-2 text-sm text-slate-500">Kelola aktivitas berdasarkan tanggal, kategori, dan status.</p>
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-700" />
          <h2 className="text-base font-semibold text-slate-950">{editingId ? "Edit Aktivitas" : "Tambah Aktivitas"}</h2>
        </div>
        {formErrors.length ? (
          <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {formErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Judul</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Kategori</span>
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ActivityCategory }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              {activityCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tanggal</span>
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ActivityStatus }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              {activityStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Mulai</span>
            <input
              type="time"
              required
              value={form.startTime}
              onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Selesai</span>
            <input
              type="time"
              required
              value={form.endTime}
              onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">Catatan</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
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
              className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Filter tanggal</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Filter kategori</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as "Semua" | ActivityCategory)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Semua">Semua</option>
            {activityCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      <ActivityList
        activities={paginatedActivities.items}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onComplete={handleComplete}
      />
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
