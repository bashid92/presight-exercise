import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, fetchUsers } from '../api/users.api';
import { Facets, FilterState, User } from '../types';
import { serializeFilters } from '../utils/filterParams';

interface UseUsersResult {
  users: User[];
  facets: Facets;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  fetchNextPage: () => void;
  refetch: () => void;
}

const EMPTY_FACETS: Facets = { topHobbies: [], topNationalities: [] };

/**
 * Loads users page by page for the given filters.
 * A filter change starts again from page 1 and refreshes both the list and the facets.
 * Any request still in flight for the old filters is aborted, so a slow old
 * response can never overwrite newer results.
 */
export function useUsers(filters: FilterState): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  // Same filters in a different object (e.g. after a re-render) must not refetch.
  const filtersKey = serializeFilters(filters).toString();
  const stableFilters = useMemo(() => filters, [filtersKey]);

  const load = useCallback(
    async (pageNum: number) => {
      const isFirstPage = pageNum === 1;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      inFlightRef.current = true;

      if (isFirstPage) setIsLoading(true);
      else setIsFetchingNextPage(true);
      setError(null);

      try {
        const res = await fetchUsers(stableFilters, pageNum, controller.signal);
        setUsers((prev) => (isFirstPage ? res.data : [...prev, ...res.data]));
        setFacets(res.facets);
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
        setPage(pageNum);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (isFirstPage) {
          // Never leave results from the previous filters on screen under an error.
          setUsers([]);
          setFacets(EMPTY_FACETS);
          setTotal(0);
          setHasMore(false);
          setPage(0);
        }
        setError(err instanceof ApiError ? err : new Error('Could not reach the server. Check your connection.'));
      } finally {
        if (controllerRef.current === controller) {
          inFlightRef.current = false;
          setIsLoading(false);
          setIsFetchingNextPage(false);
        }
      }
    },
    [stableFilters],
  );

  useEffect(() => {
    load(1);
    return () => controllerRef.current?.abort();
  }, [load]);

  const fetchNextPage = useCallback(() => {
    if (inFlightRef.current || !hasMore || error) return;
    load(page + 1);
  }, [hasMore, error, load, page]);

  // Retry the page that failed: page 1 if nothing loaded yet, otherwise the next one.
  const refetch = useCallback(() => load(users.length === 0 ? 1 : page + 1), [load, page, users.length]);

  return {
    users,
    facets,
    isLoading,
    isFetchingNextPage,
    isError: error !== null,
    error,
    hasMore,
    total,
    fetchNextPage,
    refetch,
  };
}
