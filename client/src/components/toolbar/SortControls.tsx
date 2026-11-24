import { ArrowDown01, ArrowDownAZ, ArrowUp10, ArrowUpZA, ChevronDown } from 'lucide-react';
import { SortField, SortOrder } from '../../types';

interface SortControlsProps {
  field: SortField;
  order: SortOrder;
  onChange: (field: SortField, order: SortOrder) => void;
}

const FIELD_LABELS: Record<SortField, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  age: 'Age',
  nationality: 'Nationality',
};

const ORDER_ICONS = {
  text: { asc: ArrowDownAZ, desc: ArrowUpZA },
  number: { asc: ArrowDown01, desc: ArrowUp10 },
} as const;

export function SortControls({ field, order, onChange }: SortControlsProps) {
  const OrderIcon = ORDER_ICONS[field === 'age' ? 'number' : 'text'][order];
  const orderName = order === 'asc' ? 'Ascending' : 'Descending';

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <select
          value={field}
          aria-label="Sort by field"
          onChange={(e) => onChange(e.target.value as SortField, order)}
          className="field cursor-pointer appearance-none py-2 pr-8 pl-3 text-xs font-semibold text-slate-700 hover:border-slate-300"
        >
          {(Object.keys(FIELD_LABELS) as SortField[]).map((key) => (
            <option key={key} value={key}>
              Sort: {FIELD_LABELS[key]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
      </div>

      <button
        type="button"
        onClick={() => onChange(field, order === 'asc' ? 'desc' : 'asc')}
        aria-label={`Sort direction: ${orderName}`}
        title={`Sort direction: ${orderName}. Click to toggle.`}
        className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        <OrderIcon className="size-4 text-blue-600" />
      </button>
    </div>
  );
}
