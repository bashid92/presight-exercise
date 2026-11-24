import { ReactNode, useCallback, useState } from 'react';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { MobileFilterDrawer } from '../components/filters/MobileFilterDrawer';
import { AppHeader } from '../components/layout/AppHeader';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingSkeleton } from '../components/states/LoadingSkeleton';
import { SearchBar } from '../components/toolbar/SearchBar';
import { SortControls } from '../components/toolbar/SortControls';
import { UserList } from '../components/users/UserList';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useUsers } from '../hooks/useUsers';

export function HomePage() {
  const { filters, setSearch, toggleNationality, toggleHobby, setSorting, clearAllFilters } = useUrlFilters();
  const result = useUsers(filters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const activeFilterCount = filters.nationalities.length + filters.hobbies.length;
  const hasFilters = filters.search !== '' || activeFilterCount > 0;

  const sidebar = {
    facets: result.facets,
    nationalities: filters.nationalities,
    hobbies: filters.hobbies,
    onToggleNationality: toggleNationality,
    onToggleHobby: toggleHobby,
    onReset: clearAllFilters,
  };

  let results: ReactNode;
  if (result.isLoading) {
    results = <LoadingSkeleton />;
  } else if (result.error && result.users.length === 0) {
    results = <ErrorState message={result.error.message} onRetry={result.refetch} />;
  } else if (result.users.length === 0) {
    results = <EmptyState hasFilters={hasFilters} onReset={clearAllFilters} />;
  } else {
    results = (
      <UserList
        users={result.users}
        selectedHobbies={filters.hobbies}
        selectedNationalities={filters.nationalities}
        onToggleHobby={toggleHobby}
        onToggleNationality={toggleNationality}
        hasMore={result.hasMore}
        loadingMore={result.isFetchingNextPage}
        loadMoreError={result.error}
        onLoadMore={result.fetchNextPage}
        onRetry={result.refetch}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader total={result.total} activeFilterCount={activeFilterCount} onOpenFilters={() => setDrawerOpen(true)} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 lg:p-8">
        <div className="panel flex flex-col items-stretch justify-between gap-3.5 p-4 md:flex-row md:items-center">
          <div className="max-w-xl flex-1">
            <SearchBar value={filters.search} onSearch={setSearch} />
          </div>
          <div className="w-full shrink-0 md:w-64">
            <SortControls field={filters.sortField} order={filters.sortOrder} onChange={setSorting} />
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-240px)] flex-1 items-start gap-6">
          <div className="sticky top-24 hidden w-72 shrink-0 lg:block">
            <FilterSidebar {...sidebar} />
          </div>
          <section aria-label="Results" className="flex h-[calc(100vh-230px)] min-h-125 w-full flex-1 flex-col">
            {results}
          </section>
        </div>
      </main>

      <MobileFilterDrawer {...sidebar} open={drawerOpen} total={result.total} onClose={closeDrawer} />
    </div>
  );
}
