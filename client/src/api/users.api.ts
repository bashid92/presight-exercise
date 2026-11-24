import { API_BASE_URL } from '../config/env';
import { FilterState, UsersResponse } from '../types';

export const PAGE_SIZE = 24;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUsersParams(filters: FilterState, page: number): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sortField: filters.sortField,
    sortOrder: filters.sortOrder,
  });

  const search = filters.search.trim();
  if (search) params.set('search', search);
  if (filters.nationalities.length > 0) params.set('nationalities', filters.nationalities.join(','));
  if (filters.hobbies.length > 0) params.set('hobbies', filters.hobbies.join(','));

  return params;
}

/** One page of users plus the facets for the same filters. */
export async function fetchUsers(filters: FilterState, page: number, signal?: AbortSignal): Promise<UsersResponse> {
  const res = await fetch(`${API_BASE_URL}/users?${buildUsersParams(filters, page)}`, { signal });

  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { error?: string }).error ?? '';
    } catch {
      // Body was not JSON (e.g. a proxy error page); keep the status-only message.
    }
    throw new ApiError(detail || `Failed to fetch users (HTTP ${res.status})`, res.status);
  }

  return res.json() as Promise<UsersResponse>;
}
