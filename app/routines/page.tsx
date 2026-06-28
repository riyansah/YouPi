"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { useDashboardStore } from "@/lib/dashboard-store";
import type { Routine, TaskPriority, Weekday } from "@/lib/types";
import { taskPriorities, weekdays } from "@/lib/types";
import {
  cn,
  formatRoutineDays,
  formatTimeRange,
  getWeekdayFromDate,
  makeId,
  nowIso,
  paginateItems,
  sortRoutines,
  todayDate
} from "@/lib/utils";
import { validateRoutineForm } from "@/lib/validation";

const pageSize = 10;

const priorityStyles = {
  Rendah: "bg-slate-100 text-slate-700",
  Sedang: "bg-blue-50 text-blue-700",
  Tinggi: "bg-rose-50 text-rose-700"
};

const emptyRoutineForm = {
  title: "",
  days: [getWeekdayFromDate(todayDate())] as Weekday[],
  startTime: "07:00",
  endTime: "07:30",
  priority: "Sedang" as TaskPriority,
  notes: ""
};

function RoutinesPageContent() {
  const { routines, setRoutines } = useDashboardStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRoutineId = searchParams.get("routineId");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRoutineForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const orderedRoutines = useMemo(() => sortRoutines(routines), [routines]);
  const paginatedRoutines = useMemo(() => paginateItems(orderedRoutines, currentPage, pageSize), [currentPage, orderedRoutines]);

  useEffect(() => {
    if (currentPage !== paginatedRoutines.currentPage) {
      setCurrentPage(paginatedRoutines.currentPage);
    }
  }, [currentPage, paginatedRoutines.currentPage]);

  useEffect(() => {
    if (!selectedRoutineId) {
      return;
    }

    const routine = orderedRoutines.find((item) => item.id === selectedRoutineId);

    if (!routine) {
      return;
    }

    const targetIndex = orderedRoutines.findIndex((item) => item.id === routine.id);
    const targetPage = Math.floor(targetIndex / pageSize) + 1;

    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
      return;
    }

    if (editingId !== routine.id) {
      setEditingId(routine.id);
      setForm({
        title: routine.title,
        days: routine.days,
        startTime: routine.startTime,
        endTime: routine.endTime,
        priority: routine.priority,
        notes: routine.notes
      });
      setFormErrors([]);
    }

    router.replace("/routines", { scroll: false });
  }, [currentPage, editingId, orderedRoutines, router, selectedRoutineId]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyRoutineForm, days: [getWeekdayFromDate(todayDate())] });
    setFormErrors([]);
  }

  function toggleDay(day: Weekday) {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day]
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateRoutineForm(form);

    if (errors.length) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);
    const timestamp = nowIso();

    if (editingId) {
      setRoutines((current) =>
        current.map((routine) =>
          routine.id === editingId
            ? {
                ...routine,
                ...form,
                updatedAt: timestamp
              }
            : routine
        )
      );
    } else {
      const routine: Routine = {
        id: makeId("routine"),
        ...form,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      setRoutines((current) => [routine, ...current]);
    }

    resetForm();
  }

  function handleEdit(routine: Routine) {
    setEditingId(routine.id);
    setForm({
      title: routine.title,
      days: routine.days,
      startTime: routine.startTime,
      endTime: routine.endTime,
      priority: routine.priority,
      notes: routine.notes
    });
    setFormErrors([]);
  }

  function handleDelete(id: string) {
    const routine = routines.find((item) => item.id === id);

    if (!window.confirm(`Hapus rutinitas "${routine?.title || "ini"}"?`)) {
      return;
    }

    setRoutines((current) => current.filter((routine) => routine.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Rutinitas</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Rutinitas Mingguan</h1>
        <p className="mt-2 text-sm text-slate-500">Kelola rutinitas harian dari Senin sampai Minggu.</p>
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-700" />
          <h2 className="text-base font-semibold text-slate-950">{editingId ? "Edit Rutinitas" : "Tambah Rutinitas"}</h2>
        </div>
        {formErrors.length ? (
          <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {formErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">Judul</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <fieldset className="space-y-2 lg:col-span-2">
            <legend className="text-sm font-medium text-slate-700">Hari aktif</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {weekdays.map((day) => (
                <label key={day} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.days.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </fieldset>
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
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Prioritas</span>
            <select
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
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
              {editingId ? "Simpan perubahan" : "Tambah rutinitas"}
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

      {paginatedRoutines.totalItems ? (
        <div className="space-y-3">
          {paginatedRoutines.items.map((routine) => (
            <article
              key={routine.id}
              className="rounded border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">{routine.title}</h2>
                    <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityStyles[routine.priority])}>
                      {routine.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatRoutineDays(routine.days)} · {formatTimeRange(routine.startTime, routine.endTime)}
                  </p>
                  {routine.notes ? <p className="mt-2 text-sm text-slate-600">{routine.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(routine)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                    aria-label={`Edit ${routine.title}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(routine.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                    aria-label={`Hapus ${routine.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Belum ada rutinitas yang tersimpan.
        </div>
      )}

      <Pagination
        currentPage={paginatedRoutines.currentPage}
        totalPages={paginatedRoutines.totalPages}
        totalItems={paginatedRoutines.totalItems}
        startItem={paginatedRoutines.startItem}
        endItem={paginatedRoutines.endItem}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default function RoutinesPage() {
  return (
    <Suspense fallback={null}>
      <RoutinesPageContent />
    </Suspense>
  );
}
