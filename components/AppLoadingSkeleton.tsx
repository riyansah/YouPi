const lines = ["w-3/5", "w-4/5", "w-2/3"] as const;

export function AppLoadingSkeleton() {
  return (
    <div className="app-shell min-h-screen lg:flex" role="status" aria-live="polite">
      <span className="sr-only">Loading YouPi...</span>
      <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80 lg:block" aria-hidden="true">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer h-11 w-11 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 w-16 rounded-full" />
            <div className="skeleton-shimmer h-4 w-28 rounded-full" />
          </div>
        </div>
        <div className="mt-10 space-y-3">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
              <div className={`skeleton-shimmer h-3 rounded-full ${lines[index % lines.length]}`} />
            </div>
          ))}
        </div>
      </aside>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-hidden="true">
        <div className="skeleton-shimmer h-52 rounded-3xl sm:h-56" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:p-5">
              <div className="skeleton-shimmer h-3 w-2/3 rounded-full" />
              <div className="skeleton-shimmer mt-4 h-8 w-1/3 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="skeleton-shimmer h-80 rounded-2xl" />)}
        </div>
      </main>
    </div>
  );
}
