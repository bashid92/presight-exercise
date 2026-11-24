import { FilterState, SORT_FIELDS, SortField } from '../types';

export const DEFAULT_SORT_FIELD: SortField = 'first_name';
export const DEFAULT_FILTERS: FilterState = {
  search: '',
  nationalities: [],
  hobbies: [],
  sortField: DEFAULT_SORT_FIELD,
  sortOrder: 'asc',
};

function splitList(value: string | null): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(',').map((v) => v.trim()).filter(Boolean)));
}

/**
 * Reads the view state from the URL query string.
 * Short keys (q, nat, hob, sort, order) are what the app writes; long keys are accepted too.
 * Unknown or invalid values fall back to the defaults, so a hand-edited URL never breaks the page.
 */
export function parseFilters(params: URLSearchParams): FilterState {
  const rawSort = params.get('sort') ?? params.get('sortField') ?? DEFAULT_SORT_FIELD;
  const rawOrder = (params.get('order') ?? params.get('sortOrder') ?? 'asc').toLowerCase();

  return {
    search: params.get('q') ?? params.get('search') ?? '',
    nationalities: splitList(params.get('nat') ?? params.get('nationalities')),
    hobbies: splitList(params.get('hob') ?? params.get('hobbies')),
    sortField: SORT_FIELDS.includes(rawSort as SortField) ? (rawSort as SortField) : DEFAULT_SORT_FIELD,
    sortOrder: rawOrder === 'desc' ? 'desc' : 'asc',
  };
}

/** Writes the view state to a query string, leaving out defaults to keep URLs short. */
export function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  const search = filters.search.trim();

  if (search) params.set('q', search);
  if (filters.nationalities.length > 0) params.set('nat', filters.nationalities.join(','));
  if (filters.hobbies.length > 0) params.set('hob', filters.hobbies.join(','));
  if (filters.sortField !== DEFAULT_SORT_FIELD) params.set('sort', filters.sortField);
  if (filters.sortOrder !== 'asc') params.set('order', filters.sortOrder);

  return params;
}

/** Adds the value if missing, removes it if present. */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
