import { SlidersHorizontal, Users } from 'lucide-react';

interface AppHeaderProps {
  total: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

export function AppHeader({ total, activeFilterCount, onOpenFilters }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Users className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              User Directory
              <span className="rounded-full border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Presight
              </span>
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Search, filter, and explore profiles with live dynamic facets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:flex"
            aria-live="polite"
          >
            Total Profiles: <strong className="font-bold text-blue-600">{total.toLocaleString()}</strong>
          </p>

          <button
            type="button"
            onClick={onOpenFilters}
            aria-haspopup="dialog"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 lg:hidden"
          >
            <SlidersHorizontal className="size-4 text-blue-600" aria-hidden />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
