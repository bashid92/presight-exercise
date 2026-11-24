import { SORT_FIELDS, SortField, UserQueryParams } from '../types/user.types';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 24;
export const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;
const MAX_FILTER_VALUES = 50;

type RawQuery = Record<string, unknown>;

/** Thrown for a bad query string; the error handler turns it into HTTP 400. */
export class ValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstString(value[0]);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Reads a comma-separated list (`?hobbies=a,b`) or repeated keys (`?hobbies=a&hobbies=b`),
 * trims each value and drops blanks and duplicates (case-insensitive).
 */
export function parseList(value: unknown): string[] {
  const parts = (Array.isArray(value) ? value : [value])
    .filter((v): v is string => typeof v === 'string')
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  return parts.filter((v) => {
    const key = v.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parsePositiveInt(value: unknown, name: string, fallback: number): number {
  const raw = firstString(value);
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new ValidationError(`"${name}" must be a positive integer.`);
  }
  return Number(raw);
}

/**
 * Parses and validates GET /api/users query parameters.
 * Accepts the long names and the short URL names the client uses (q, nat, hob, sort, order).
 */
export function parseUserQuery(query: RawQuery): UserQueryParams {
  const search = (firstString(query.search ?? query.q) ?? '').trim();
  if (search.length > MAX_SEARCH_LENGTH) {
    throw new ValidationError(`"search" must be at most ${MAX_SEARCH_LENGTH} characters.`);
  }

  const nationalities = parseList(query.nationalities ?? query.nat);
  const hobbies = parseList(query.hobbies ?? query.hob);
  if (nationalities.length > MAX_FILTER_VALUES || hobbies.length > MAX_FILTER_VALUES) {
    throw new ValidationError(`At most ${MAX_FILTER_VALUES} values per filter.`);
  }

  const rawSortField = firstString(query.sortField ?? query.sort) || 'first_name';
  if (!SORT_FIELDS.includes(rawSortField as SortField)) {
    throw new ValidationError(`"sortField" must be one of: ${SORT_FIELDS.join(', ')}.`);
  }

  const rawSortOrder = (firstString(query.sortOrder ?? query.order) || 'asc').toLowerCase();
  if (rawSortOrder !== 'asc' && rawSortOrder !== 'desc') {
    throw new ValidationError('"sortOrder" must be "asc" or "desc".');
  }

  const page = parsePositiveInt(query.page, 'page', DEFAULT_PAGE);
  const limit = parsePositiveInt(query.limit, 'limit', DEFAULT_LIMIT);
  if (limit > MAX_LIMIT) {
    throw new ValidationError(`"limit" must be at most ${MAX_LIMIT}.`);
  }

  return {
    search: search || undefined,
    nationalities,
    hobbies,
    sortField: rawSortField as SortField,
    sortOrder: rawSortOrder,
    page,
    limit,
  };
}
