"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { defaultSettings } from "@/lib/data";
import type { Activity, DashboardSettings, Routine, Task } from "@/lib/types";

interface DashboardData {
  tasks: Task[];
  activities: Activity[];
  routines: Routine[];
  settings: DashboardSettings;
}

interface DashboardDataContextValue extends DashboardData {
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
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

        if (!ignore) {
          setTasksState(data.tasks);
          setActivitiesState(data.activities);
          setRoutinesState(data.routines);
          setSettingsState(data.settings);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError("Gagal memuat data dashboard.");
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

        setError(null);
      } catch {
        setError("Gagal menyimpan data dashboard. Muat ulang halaman sebelum melanjutkan perubahan.");
      }
    });
  }, []);

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

  const setSettings = useCallback<Dispatch<SetStateAction<DashboardSettings>>>(
    (action) => {
      setSettingsState((current) => {
        const next = resolveAction(action, current);
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
    setTasksState(saved.tasks);
    setActivitiesState(saved.activities);
    setRoutinesState(saved.routines);
    setSettingsState(saved.settings);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ tasks, setTasks, activities, setActivities, routines, setRoutines, settings, setSettings, replaceDashboardData }),
    [activities, replaceDashboardData, routines, setActivities, setRoutines, setSettings, setTasks, settings, tasks]
  );

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 text-sm font-medium text-slate-600">
        Memuat dashboard...
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
