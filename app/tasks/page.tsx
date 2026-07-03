"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RotateCcw, Save } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { TaskTable } from "@/components/TaskTable";
import { useDashboardStore } from "@/lib/dashboard-store";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { taskPriorities, taskStatuses } from "@/lib/types";
import { makeId, nowIso, paginateItems, todayDate, useNow } from "@/lib/utils";
import { validateTaskForm } from "@/lib/validation";

const pageSize = 10;

const emptyTaskForm = {
  title: "",
  description: "",
  status: "Berjalan" as TaskStatus,
  priority: "Sedang" as TaskPriority,
  startDate: todayDate(),
  deadline: todayDate()
};

function getStatusFilterParam(value: string | null): "Semua" | TaskStatus | null {
  if (value === "Semua" || taskStatuses.includes(value as TaskStatus)) {
    return value as "Semua" | TaskStatus;
  }

  return null;
}

function TasksPageContent() {
  const { tasks, setTasks } = useDashboardStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get("taskId");
  const statusQuery = getStatusFilterParam(searchParams.get("status"));
  const now = useNow();
  const [statusFilter, setStatusFilter] = useState<"Semua" | TaskStatus>(() => statusQuery || "Semua");
  const [priorityFilter, setPriorityFilter] = useState<"Semua" | TaskPriority>("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTaskForm);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const statusMatch = statusFilter === "Semua" || task.status === statusFilter;
        const priorityMatch = priorityFilter === "Semua" || task.priority === priorityFilter;
        return statusMatch && priorityMatch;
      }),
    [priorityFilter, statusFilter, tasks]
  );

  const paginatedTasks = useMemo(
    () => paginateItems(filteredTasks, currentPage, pageSize),
    [currentPage, filteredTasks]
  );

  useEffect(() => {
    if (!selectedTaskId && statusQuery && statusFilter !== statusQuery) {
      setStatusFilter(statusQuery);
    }
  }, [selectedTaskId, statusFilter, statusQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    if (currentPage !== paginatedTasks.currentPage) {
      setCurrentPage(paginatedTasks.currentPage);
    }
  }, [currentPage, paginatedTasks.currentPage]);

  useEffect(() => {
    if (!selectedTaskId) {
      return;
    }

    const task = tasks.find((item) => item.id === selectedTaskId);

    if (!task) {
      return;
    }

    if (statusFilter !== "Semua") {
      setStatusFilter("Semua");
      return;
    }

    if (priorityFilter !== "Semua") {
      setPriorityFilter("Semua");
      return;
    }

    const targetIndex = tasks.findIndex((item) => item.id === task.id);
    const targetPage = Math.floor(targetIndex / pageSize) + 1;

    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
      return;
    }

    if (editingId !== task.id) {
      setEditingId(task.id);
      setForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        startDate: task.startDate,
        deadline: task.deadline
      });
      setFormErrors([]);
    }

    router.replace("/tasks", { scroll: false });
  }, [currentPage, editingId, priorityFilter, router, selectedTaskId, statusFilter, tasks]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyTaskForm, startDate: todayDate(), deadline: todayDate() });
    setFormErrors([]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateTaskForm(form);

    if (errors.length) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);
    const timestamp = nowIso();

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
                ...task,
                ...form,
                completedAt: form.status === "Selesai" ? task.completedAt || timestamp : null,
                updatedAt: timestamp
              }
            : task
        )
      );
    } else {
      const task: Task = {
        id: makeId("task"),
        ...form,
        completedAt: form.status === "Selesai" ? timestamp : null,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      setTasks((current) => [task, ...current]);
    }

    resetForm();
  }

  function handleEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      deadline: task.deadline
    });
  }

  function handleDelete(id: string) {
    const task = tasks.find((item) => item.id === id);

    if (!window.confirm(`Hapus pekerjaan "${task?.title || "ini"}"?`)) {
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    const timestamp = nowIso();
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
              completedAt: status === "Selesai" ? task.completedAt || timestamp : null,
              updatedAt: timestamp
            }
          : task
      )
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Pekerjaan</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Kelola Pekerjaan</h1>
          <p className="mt-2 text-sm text-slate-500">Tambah, edit, hapus, filter, dan ubah status pekerjaan.</p>
        </div>
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-700" />
          <h2 className="text-base font-semibold text-slate-950">{editingId ? "Edit Pekerjaan" : "Tambah Pekerjaan"}</h2>
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
            <span className="text-sm font-medium text-slate-700">Deskripsi</span>
            <input
              required
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tanggal mulai</span>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Deadline</span>
            <input
              type="date"
              required
              value={form.deadline}
              onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Save className="h-4 w-4" />
              {editingId ? "Simpan perubahan" : "Tambah pekerjaan"}
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
          <span className="text-sm font-medium text-slate-700">Filter status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "Semua" | TaskStatus)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Semua">Semua</option>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Filter prioritas</span>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as "Semua" | TaskPriority)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Semua">Semua</option>
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
      </section>

      <TaskTable
        tasks={paginatedTasks.items}
        now={now}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
      <Pagination
        currentPage={paginatedTasks.currentPage}
        totalPages={paginatedTasks.totalPages}
        totalItems={paginatedTasks.totalItems}
        startItem={paginatedTasks.startItem}
        endItem={paginatedTasks.endItem}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageContent />
    </Suspense>
  );
}
