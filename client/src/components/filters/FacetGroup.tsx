import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { FacetCount } from '../../types';

interface FacetGroupProps {
  title: string;
  icon: ReactNode;
  facets: FacetCount[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** One "Top 20" list in the sidebar. Each row is a checkbox with its user count. */
export function FacetGroup({ title, icon, facets, selected, onToggle }: FacetGroupProps) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <header className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase">
          {icon}
          {title}
        </h3>
        <span className="text-[11px] font-medium text-slate-400">Top 20</span>
      </header>

      {facets.length === 0 ? (
        <p className="py-2 text-xs text-slate-400 italic">No {title.toLowerCase()} in current result set</p>
      ) : (
        <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {facets.map(({ value, count }) => {
            const on = selected.includes(value);
            return (
              <li key={value}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => onToggle(value)}
                  className={`facet-row ${on ? 'facet-row-on' : ''}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        on ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {on && <Check className="size-3 stroke-3" />}
                    </span>
                    <span className="truncate text-xs">{value}</span>
                  </span>
                  <span className="facet-badge">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
