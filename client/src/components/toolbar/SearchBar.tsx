import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  delayMs?: number;
}

/** Name filter. Keeps its own draft while typing and sends it after a short pause. */
export function SearchBar({ value, onSearch, delayMs = 300 }: SearchBarProps) {
  const [draft, setDraft] = useState(value);
  const { debounced, cancel } = useDebouncedCallback(onSearch, delayMs);

  // The URL changed from elsewhere (Back, Forward, Clear all): show that value.
  useEffect(() => {
    setDraft(value);
    cancel();
  }, [value, cancel]);

  const clear = () => {
    cancel();
    setDraft('');
    onSearch('');
  };

  return (
    <label className="relative block w-full">
      <span className="sr-only">Search users by first or last name</span>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="text"
        value={draft}
        maxLength={100}
        placeholder="Search across first and last name..."
        onChange={(e) => {
          setDraft(e.target.value);
          debounced(e.target.value);
        }}
        onKeyDown={(e) => e.key === 'Escape' && draft && clear()}
        className="field py-2.5 pr-9 pl-10 text-sm"
      />
      {draft && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          title="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}
