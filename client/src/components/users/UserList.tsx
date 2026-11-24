import { RefObject, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { User } from '../../types';
import { UserCard } from './UserCard';

interface UserListProps {
  users: User[];
  selectedHobbies: string[];
  selectedNationalities: string[];
  onToggleHobby: (hobby: string) => void;
  onToggleNationality: (nationality: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: Error | null;
  onLoadMore: () => void;
  onRetry: () => void;
}

const ROW_ESTIMATE_PX = 155;
const ROW_GAP_PX = 14;
/** Ask for the next page once the last rendered row is this close to the end. */
const PREFETCH_ROWS = 2;

/** 1 column under 600px of list width, 2 under 1000px, else 3. */
function useColumnCount(ref: RefObject<HTMLElement | null>) {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumns(width < 600 ? 1 : width < 1000 ? 2 : 3);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return columns;
}

/**
 * Virtualised grid. Each virtual item is a row of cards; only rows near the
 * viewport are in the DOM. Rows are measured after render, so a taller card
 * never overlaps the next row.
 */
export function UserList({
  users,
  selectedHobbies,
  selectedNationalities,
  onToggleHobby,
  onToggleNationality,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
  onRetry,
}: UserListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(scrollRef);
  const rowCount = Math.ceil(users.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_ESTIMATE_PX,
    overscan: 5,
  });

  const rows = virtualizer.getVirtualItems();
  const lastIndex = rows.at(-1)?.index ?? -1;

  useEffect(() => {
    const nearEnd = lastIndex >= rowCount - PREFETCH_ROWS;
    if (nearEnd && hasMore && !loadingMore && !loadMoreError) onLoadMore();
  }, [lastIndex, rowCount, hasMore, loadingMore, loadMoreError, onLoadMore]);

  return (
    <div
      ref={scrollRef}
      role="feed"
      aria-label="User directory"
      aria-busy={loadingMore}
      className="relative h-[calc(100vh-250px)] min-h-125 w-full flex-1 overflow-y-auto pr-1"
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {rows.map((row) => (
          <div
            key={row.key}
            ref={virtualizer.measureElement}
            data-index={row.index}
            className="absolute top-0 left-0 grid w-full has-[[aria-expanded=true]]:z-10"
            style={{
              transform: `translateY(${row.start}px)`,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: ROW_GAP_PX,
              paddingBottom: ROW_GAP_PX,
            }}
          >
            {users.slice(row.index * columns, (row.index + 1) * columns).map((user) => (
              <UserCard
                key={user.id}
                user={user}
                selectedHobbies={selectedHobbies}
                selectedNationalities={selectedNationalities}
                onToggleHobby={onToggleHobby}
                onToggleNationality={onToggleNationality}
              />
            ))}
          </div>
        ))}
      </div>

      {loadingMore && (
        <p className="flex items-center justify-center gap-2 py-6 text-xs font-semibold text-slate-500">
          <Loader2 className="size-4 animate-spin text-blue-600" aria-hidden />
          Loading more users...
        </p>
      )}

      {loadMoreError && (
        <div role="alert" className="flex items-center justify-center gap-3 py-6 text-xs font-semibold text-rose-700">
          <AlertTriangle className="size-4" aria-hidden />
          Could not load more users.
          <button type="button" onClick={onRetry} className="btn-danger px-3 py-1.5 text-xs">
            <RefreshCw className="size-3" aria-hidden />
            Try Again
          </button>
        </div>
      )}

      {!hasMore && users.length > 0 && (
        <p className="py-6 text-center text-xs font-medium text-slate-400">
          You have reached the end of {users.length.toLocaleString()} profiles
        </p>
      )}
    </div>
  );
}
