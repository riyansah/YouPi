"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { defaultSettings } from "@/lib/data";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
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

interface DashboardDataContextValue extends DashboardData {
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setHistory: Dispatch<SetStateAction<HistoryEvent[]>>;
  setSettings: Dispatch<SetStateAction<DashboardSettings>>;
  replaceDashboardData: (data: DashboardData) => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

function resolveAction<T>(action: SetStateAction<T>, current: T) {
  return typeof action === "function" ? (action as (value: T) => T)(current) : action;
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

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      try {
        const response = await fetch("/api/dashboard-data");

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load dashboard data.");
        }

        const data = (await response.json()) as DashboardData;
        const nextSettings = normalizeDashboardSettings(data.settings);

        if (!ignore) {
          setTasksState(data.tasks);
          setActivitiesState(data.activities);
          setRoutinesState(data.routines);
          setNotesState(data.notes || []);
          setHistoryState(data.history || []);
          setSettingsState(nextSettings);
          window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextSettings.language);
          setError(null);
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
  }, []);

  const persistPatch = useCallback((patch: Partial<DashboardData>) => {
    saveChainRef.current = saveChainRef.current.then(async () => {
      try {
        const response = await fetch("/api/dashboard-data", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch)
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to save dashboard data.");
        }

        const saved = (await response.json()) as DashboardData;
        setHistoryState(saved.history || []);
        setError(null);
      } catch {
        setError("Failed to save dashboard data. Reload the page before continuing.");
      }
    });
  }, []);

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
          void persistPatch({ tasks: next });
        }

        return next;
      });

      setActivitiesState((current) => {
        const next = normalizeActivitiesForTime(current, now, timeZone);

        if (next !== current) {
          void persistPatch({ activities: next });
        }

        return next;
      });
    }

    syncTimedStatuses();
    const timer = window.setInterval(syncTimedStatuses, 30000);
    return () => window.clearInterval(timer);
  }, [loaded, persistPatch, settings.timeZone]);

  const setTasks = useCallback<Dispatch<SetStateAction<Task[]>>>(
    (action) => {
      setTasksState((current) => {
        const next = resolveAction(action, current);
        void persistPatch({ tasks: next });
        return next;
      });
    },
    [persistPatch]
  );

  const setActivities = useCallback<Dispatch<SetStateAction<Activity[]>>>(
    (action) => {
      setActivitiesState((current) => {
        const next = resolveAction(action, current);
        void persistPatch({ activities: next });
        return next;
      });
    },
    [persistPatch]
  );

  const setRoutines = useCallback<Dispatch<SetStateAction<Routine[]>>>(
    (action) => {
      setRoutinesState((current) => {
        const next = resolveAction(action, current);
        void persistPatch({ routines: next });
        return next;
      });
    },
    [persistPatch]
  );

  const setNotes = useCallback<Dispatch<SetStateAction<Note[]>>>(
    (action) => {
      setNotesState((current) => {
        const next = resolveAction(action, current);
        void persistPatch({ notes: next });
        return next;
      });
    },
    [persistPatch]
  );

  const setHistory = useCallback<Dispatch<SetStateAction<HistoryEvent[]>>>(
    (action) => {
      setHistoryState((current) => {
        const next = resolveAction(action, current);
        void persistPatch({ history: next });
        return next;
      });
    },
    [persistPatch]
  );

  const setSettings = useCallback<Dispatch<SetStateAction<DashboardSettings>>>(
    (action) => {
      setSettingsState((current) => {
        const next = normalizeDashboardSettings(resolveAction(action, current));
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next.language);
        void persistPatch({ settings: next });
        return next;
      });
    },
    [persistPatch]
  );

  const replaceDashboardData = useCallback(async (data: DashboardData) => {
    const response = await fetch("/api/dashboard-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to replace dashboard data.");
    }

    const saved = (await response.json()) as DashboardData;
    const nextSettings = normalizeDashboardSettings(saved.settings);
    setTasksState(saved.tasks);
    setActivitiesState(saved.activities);
    setRoutinesState(saved.routines);
    setNotesState(saved.notes || []);
    setHistoryState(saved.history || []);
    setSettingsState(nextSettings);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextSettings.language);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      setTasks,
      activities,
      setActivities,
      routines,
      setRoutines,
      notes,
      setNotes,
      history,
      setHistory,
      settings,
      setSettings,
      replaceDashboardData
    }),
    [activities, history, notes, replaceDashboardData, routines, setActivities, setHistory, setNotes, setRoutines, setSettings, setTasks, settings, tasks]
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
