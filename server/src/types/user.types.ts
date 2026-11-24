/**
 * Shared types for the user domain.
 * Repository, service and controller all import from here.
 */

export const SORT_FIELDS = ['first_name', 'last_name', 'age', 'nationality'] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface Facets {
  topHobbies: FacetCount[];
  topNationalities: FacetCount[];
}

export interface UserFilters {
  search?: string;
  nationalities: string[];
  hobbies: string[];
}

export interface UserQueryParams extends UserFilters {
  sortField: SortField;
  sortOrder: SortOrder;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UsersResponse {
  data: User[];
  pagination: PaginationMeta;
  facets: Facets;
}

/** A SQL WHERE clause with its bound values, built in one place and reused. */
export interface FilterConditions {
  whereClause: string;
  params: (string | number)[];
}
