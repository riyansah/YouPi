"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { defaultSettings } from "@/lib/data";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import { sortNotes } from "@/lib/notes";
import { normalizeDashboardSettings } from "@/lib/storage";
import { normalizeActivitiesForTime, normalizeTasksForTime } from "@/lib/utils";
import type { Activity, DashboardSettings, HistoryEvent, Note, Routine, Task } from "@/lib/types";

interface DashboardData {
  tasks: Task[];
  activities: Activity[];
  routines: Routine[];
  notes: Note[];
  history: HistoryEvent[];
  settings: DashboardSettings;
}

type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Task, "id" | "createdAt" | "updatedAt">>;
type NewActivity = Omit<Activity, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Activity, "id" | "createdAt" | "updatedAt">>;
type NewRoutine = Omit<Routine, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Routine, "id" | "createdAt" | "updatedAt">>;
type NewNote = Omit<Note, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Note, "id" | "createdAt" | "updatedAt">>;

interface DeleteLinkedResponse<T> {
  ok: boolean;
  item: T;
  notes: Note[];
}

interface DashboardDataContextValue extends DashboardData {
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setHistory: Dispatch<SetStateAction<HistoryEvent[]>>;
  setSettings: Dispatch<SetStateAction<DashboardSettings>>;
  createTask: (task: NewTask) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<DeleteLinkedResponse<Task>>;
  createActivity: (activity: NewActivity) => Promise<Activity>;
  updateActivity: (id: string, patch: Partial<Activity>) => Promise<Activity>;
  deleteActivity: (id: string) => Promise<DeleteLinkedResponse<Activity>>;
  createRoutine: (routine: NewRoutine) => Promise<Routine>;
  updateRoutine: (id: string, patch: Partial<Routine>) => Promise<Routine>;
  deleteRoutine: (id: string) => Promise<DeleteLinkedResponse<Routine>>;
  createNote: (note: NewNote) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  replaceDashboardData: (data: DashboardData) => Promise<void>;
  resetDashboardData: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

function resolveAction<T>(action: SetStateAction<T>, current: T) {
  return typeof action === "function" ? (action as (value: T) => T)(current) : action;
}

function sameItem<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function DashboardThemeController({ theme }: { theme: DashboardSettings["theme"] }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const useDark = theme === "Gelap" || (theme === "Sistem" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", useDark);
      document.documentElement.style.colorScheme = useDark ? "dark" : "light";
    }

    applyTheme();

    if (theme !== "Sistem") {
      return;
    }

    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  return null;
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [activities, setActivitiesState] = useState<Activity[]>([]);
  const [routines, setRoutinesState] = useState<Routine[]>([]);
  const [notes, setNotesState] = useState<Note[]>([]);
  const [history, setHistoryState] = useState<HistoryEvent[]>([]);
  const [settings, setSettingsState] = useState<DashboardSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveChainRef = useRef(Promise.resolve());

  const applyDashboardData = useCallback((data: DashboardData) => {
    const nextSettings = normalizeDashboardSettings(data.settings);
    setTasksState(data.tasks);
    setActivitiesState(data.activities);
    setRoutinesState(data.routines);
    setNotesState(sortNotes(data.notes || []));
    setHistoryState(data.history || []);
    setSettingsState(nextSettings);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextSettings.language);
    setError(null);
  }, []);

  const requestJson = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, init);

    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "Request failed.");
    }

    return (await response.json()) as T;
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      try {
        const [nextTasks, nextActivities, nextRoutines, nextNotes, nextSettings, nextHistory] = await Promise.all([
          requestJson<Task[]>("/api/tasks"),
          requestJson<Activity[]>("/api/activities"),
          requestJson<Routine[]>("/api/routines"),
          requestJson<Note[]>("/api/notes"),
          requestJson<DashboardSettings>("/api/settings"),
          requestJson<HistoryEvent[]>("/api/history")
        ]);

        if (!ignore) {
          applyDashboardData({ tasks: nextTasks, activities: nextActivities, routines: nextRoutines, notes: nextNotes, history: nextHistory, settings: nextSettings });
        }
      } catch {
        if (!ignore) {
          setError("Failed to load dashboard data.");
        }
      } finally {
        if (!ignore) {
          setLoaded(true);
        }
      }
    }

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, [applyDashboardData, requestJson]);

  const enqueueSave = useCallback((operation: () => Promise<void>) => {
    saveChainRef.current = saveChainRef.current.then(async () => {
      try {
        await operation();
        setError(null);
      } catch {
        setError("Failed to save dashboard data. Reload the page before continuing.");
      }
    });
  }, []);

  const createTask = useCallback(async (task: NewTask) => {
    const saved = await requestJson<Task>("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
    setTasksState((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, [requestJson]);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    const saved = await requestJson<Task>("/api/tasks/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setTasksState((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    return saved;
  }, [requestJson]);

  const deleteTask = useCallback(async (id: string) => {
    const result = await requestJson<DeleteLinkedResponse<Task>>("/api/tasks/" + id, { method: "DELETE" });
    setTasksState((current) => current.filter((item) => item.id !== id));
    setNotesState(sortNotes(result.notes || []));
    return result;
  }, [requestJson]);

  const createActivity = useCallback(async (activity: NewActivity) => {
    const saved = await requestJson<Activity>("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activity) });
    setActivitiesState((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, [requestJson]);

  const updateActivity = useCallback(async (id: string, patch: Partial<Activity>) => {
    const saved = await requestJson<Activity>("/api/activities/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setActivitiesState((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    return saved;
  }, [requestJson]);

  const deleteActivity = useCallback(async (id: string) => {
    const result = await requestJson<DeleteLinkedResponse<Activity>>("/api/activities/" + id, { method: "DELETE" });
    setActivitiesState((current) => current.filter((item) => item.id !== id));
    setNotesState(sortNotes(result.notes || []));
    return result;
  }, [requestJson]);

  const createRoutine = useCallback(async (routine: NewRoutine) => {
    const saved = await requestJson<Routine>("/api/routines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(routine) });
    setRoutinesState((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, [requestJson]);

  const updateRoutine = useCallback(async (id: string, patch: Partial<Routine>) => {
    const saved = await requestJson<Routine>("/api/routines/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setRoutinesState((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    return saved;
  }, [requestJson]);

  const deleteRoutine = useCallback(async (id: string) => {
    const result = await requestJson<DeleteLinkedResponse<Routine>>("/api/routines/" + id, { method: "DELETE" });
    setRoutinesState((current) => current.filter((item) => item.id !== id));
    setNotesState(sortNotes(result.notes || []));
    return result;
  }, [requestJson]);

  const createNote = useCallback(async (note: NewNote) => {
    const saved = await requestJson<Note>("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(note) });
    setNotesState((current) => sortNotes([saved, ...current.filter((item) => item.id !== saved.id)]));
    return saved;
  }, [requestJson]);

  const updateNote = useCallback(async (id: string, patch: Partial<Note>) => {
    const saved = await requestJson<Note>("/api/notes/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setNotesState((current) => sortNotes(current.map((item) => (item.id === saved.id ? saved : item))));
    return saved;
  }, [requestJson]);

  const deleteNote = useCallback(async (id: string) => {
    await requestJson<{ ok: boolean }>("/api/notes/" + id, { method: "DELETE" });
    setNotesState((current) => current.filter((item) => item.id !== id));
  }, [requestJson]);

  const setTasks = useCallback<Dispatch<SetStateAction<Task[]>>>((action) => {
    setTasksState((current) => {
      const next = resolveAction(action, current);
      const currentMap = new Map(current.map((item) => [item.id, item]));
      const nextMap = new Map(next.map((item) => [item.id, item]));

      enqueueSave(async () => {
        for (const item of current) {
          if (!nextMap.has(item.id)) await deleteTask(item.id);
        }
        for (const item of next) {
          const existing = currentMap.get(item.id);
          if (!existing) await createTask(item);
          else if (!sameItem(existing, item)) await updateTask(item.id, item);
        }
      });

      return next;
    });
  }, [createTask, deleteTask, enqueueSave, updateTask]);

  const setActivities = useCallback<Dispatch<SetStateAction<Activity[]>>>((action) => {
    setActivitiesState((current) => {
      const next = resolveAction(action, current);
      const currentMap = new Map(current.map((item) => [item.id, item]));
      const nextMap = new Map(next.map((item) => [item.id, item]));

      enqueueSave(async () => {
        for (const item of current) {
          if (!nextMap.has(item.id)) await deleteActivity(item.id);
        }
        for (const item of next) {
          const existing = currentMap.get(item.id);
          if (!existing) await createActivity(item);
          else if (!sameItem(existing, item)) await updateActivity(item.id, item);
        }
      });

      return next;
    });
  }, [createActivity, deleteActivity, enqueueSave, updateActivity]);

  const setRoutines = useCallback<Dispatch<SetStateAction<Routine[]>>>((action) => {
    setRoutinesState((current) => {
      const next = resolveAction(action, current);
      const currentMap = new Map(current.map((item) => [item.id, item]));
      const nextMap = new Map(next.map((item) => [item.id, item]));

      enqueueSave(async () => {
        for (const item of current) {
          if (!nextMap.has(item.id)) await deleteRoutine(item.id);
        }
        for (const item of next) {
          const existing = currentMap.get(item.id);
          if (!existing) await createRoutine(item);
          else if (!sameItem(existing, item)) await updateRoutine(item.id, item);
        }
      });

      return next;
    });
  }, [createRoutine, deleteRoutine, enqueueSave, updateRoutine]);

  const setNotes = useCallback<Dispatch<SetStateAction<Note[]>>>((action) => {
    setNotesState((current) => {
      const next = resolveAction(action, current);
      const currentMap = new Map(current.map((item) => [item.id, item]));
      const nextMap = new Map(next.map((item) => [item.id, item]));

      enqueueSave(async () => {
        for (const item of current) {
          if (!nextMap.has(item.id)) await deleteNote(item.id);
        }
        for (const item of next) {
          const existing = currentMap.get(item.id);
          if (!existing) await createNote(item);
          else if (!sameItem(existing, item)) await updateNote(item.id, item);
        }
      });

      return sortNotes(next);
    });
  }, [createNote, deleteNote, enqueueSave, updateNote]);

  const setHistory = useCallback<Dispatch<SetStateAction<HistoryEvent[]>>>((action) => {
    setHistoryState((current) => resolveAction(action, current));
  }, []);

  const setSettings = useCallback<Dispatch<SetStateAction<DashboardSettings>>>((action) => {
    setSettingsState((current) => {
      const next = normalizeDashboardSettings(resolveAction(action, current));
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next.language);
      enqueueSave(async () => {
        const saved = await requestJson<DashboardSettings>("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
        setSettingsState(normalizeDashboardSettings(saved));
      });
      return next;
    });
  }, [enqueueSave, requestJson]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    function syncTimedStatuses() {
      const now = Date.now();
      const timeZone = settings.timeZone;

      setTasksState((current) => {
        const next = normalizeTasksForTime(current, now, timeZone);
        if (next !== current) {
          next.forEach((task) => {
            const previous = current.find((item) => item.id === task.id);
            if (previous && !sameItem(previous, task)) void updateTask(task.id, task);
          });
        }
        return next;
      });

      setActivitiesState((current) => {
        const next = normalizeActivitiesForTime(current, now, timeZone);
        if (next !== current) {
          next.forEach((activity) => {
            const previous = current.find((item) => item.id === activity.id);
            if (previous && !sameItem(previous, activity)) void updateActivity(activity.id, activity);
          });
        }
        return next;
      });
    }

    syncTimedStatuses();
    const timer = window.setInterval(syncTimedStatuses, 30000);
    return () => window.clearInterval(timer);
  }, [loaded, settings.timeZone, updateActivity, updateTask]);

  const replaceDashboardData = useCallback(async (data: DashboardData) => {
    const saved = await requestJson<DashboardData>("/api/backup", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    applyDashboardData(saved);
  }, [applyDashboardData, requestJson]);

  const resetDashboardData = useCallback(async () => {
    const saved = await requestJson<DashboardData>("/api/dashboard/reset", { method: "POST" });
    applyDashboardData(saved);
  }, [applyDashboardData, requestJson]);

  const value = useMemo(
    () => ({
      tasks,
      setTasks,
      createTask,
      updateTask,
      deleteTask,
      activities,
      setActivities,
      createActivity,
      updateActivity,
      deleteActivity,
      routines,
      setRoutines,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      notes,
      setNotes,
      createNote,
      updateNote,
      deleteNote,
      history,
      setHistory,
      settings,
      setSettings,
      replaceDashboardData,
      resetDashboardData
    }),
    [activities, createActivity, createNote, createRoutine, createTask, deleteActivity, deleteNote, deleteRoutine, deleteTask, history, notes, replaceDashboardData, resetDashboardData, routines, setActivities, setHistory, setNotes, setRoutines, setSettings, setTasks, settings, tasks, updateActivity, updateNote, updateRoutine, updateTask]
  );

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 text-sm font-medium text-slate-600">
        Loading YouPi...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f7fb]">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardDataContext.Provider value={value}>
      <DashboardThemeController theme={settings.theme} />
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardStore() {
  const value = useContext(DashboardDataContext);

  if (!value) {
    throw new Error("useDashboardStore must be used inside DashboardDataProvider");
  }

  return value;
}
