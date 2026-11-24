import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterState, SortField, SortOrder } from '../types';
import { DEFAULT_FILTERS, parseFilters, serializeFilters, toggleValue } from '../utils/filterParams';

/**
 * The URL query string is the single source of truth for the view state
 * (search text, nationalities, hobbies, sort field, sort order).
 * Reloading or sharing the URL restores the same view.
 *
 * Clicks (filters, sort) add a history entry so Back/Forward step through them.
 * Typing replaces the current entry so each keystroke does not fill the history.
 */
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<FilterState>, { replace = false } = {}) => {
      setSearchParams((current) => serializeFilters({ ...parseFilters(current), ...patch }), { replace });
    },
    [setSearchParams],
  );

  const setSearch = useCallback((search: string) => update({ search }, { replace: true }), [update]);

  const toggleNationality = useCallback(
    (nationality: string) => update({ nationalities: toggleValue(filters.nationalities, nationality) }),
    [filters.nationalities, update],
  );

  const toggleHobby = useCallback(
    (hobby: string) => update({ hobbies: toggleValue(filters.hobbies, hobby) }),
    [filters.hobbies, update],
  );

  const setSorting = useCallback(
    (sortField: SortField, sortOrder: SortOrder) => update({ sortField, sortOrder }),
    [update],
  );

  /** Clears search and filters but keeps the chosen sort. */
  const clearAllFilters = useCallback(
    () => update({ search: DEFAULT_FILTERS.search, nationalities: [], hobbies: [] }),
    [update],
  );

  return { filters, setSearch, toggleNationality, toggleHobby, setSorting, clearAllFilters };
}
