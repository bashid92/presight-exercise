import { Filter, Globe, Heart, RotateCcw } from 'lucide-react';
import { Facets } from '../../types';
import { ActiveFilters } from './ActiveFilters';
import { FacetGroup } from './FacetGroup';

export interface FilterSidebarProps {
  facets: Facets;
  nationalities: string[];
  hobbies: string[];
  onToggleNationality: (value: string) => void;
  onToggleHobby: (value: string) => void;
  onReset: () => void;
  bare?: boolean;
}

export function FilterSidebar({
  facets,
  nationalities,
  hobbies,
  onToggleNationality,
  onToggleHobby,
  onReset,
  bare = false,
}: FilterSidebarProps) {
  const activeCount = nationalities.length + hobbies.length;

  return (
    <aside className={`flex flex-col gap-6 ${bare ? '' : 'panel p-5'}`} aria-label="Filters">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight uppercase">
          <Filter className="size-4 text-blue-600" aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{activeCount}</span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            <RotateCcw className="size-3" aria-hidden />
            Reset
          </button>
        )}
      </div>

      <ActiveFilters
        nationalities={nationalities}
        hobbies={hobbies}
        onRemoveNationality={onToggleNationality}
        onRemoveHobby={onToggleHobby}
      />

      <FacetGroup
        title="Nationalities"
        icon={<Globe className="size-3.5 text-slate-500" aria-hidden />}
        facets={facets.topNationalities}
        selected={nationalities}
        onToggle={onToggleNationality}
      />

      <FacetGroup
        title="Hobbies"
        icon={<Heart className="size-3.5 text-slate-500" aria-hidden />}
        facets={facets.topHobbies}
        selected={hobbies}
        onToggle={onToggleHobby}
      />
    </aside>
  );
}
