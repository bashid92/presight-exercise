import { X } from 'lucide-react';

interface ActiveFiltersProps {
  nationalities: string[];
  hobbies: string[];
  onRemoveNationality: (value: string) => void;
  onRemoveHobby: (value: string) => void;
}

const TONES = {
  nationality: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  hobby: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
};

/** Removable chips for every selected filter. */
export function ActiveFilters({ nationalities, hobbies, onRemoveNationality, onRemoveHobby }: ActiveFiltersProps) {
  const chips = [
    ...nationalities.map((value) => ({ value, kind: 'nationality' as const, remove: onRemoveNationality })),
    ...hobbies.map((value) => ({ value, kind: 'hobby' as const, remove: onRemoveHobby })),
  ];
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Active Filters</span>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(({ value, kind, remove }) => (
          <button
            key={`${kind}:${value}`}
            type="button"
            onClick={() => remove(value)}
            aria-label={`Remove ${kind} filter ${value}`}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${TONES[kind]}`}
          >
            {value}
            <X className="size-3 opacity-70" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
