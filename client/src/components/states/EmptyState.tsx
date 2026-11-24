import { RotateCcw, UserX } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onReset: () => void;
}

export function EmptyState({ hasFilters, onReset }: EmptyStateProps) {
  return (
    <div className="panel mx-auto my-8 flex max-w-md flex-col items-center p-12 text-center">
      <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
        <UserX className="size-8" aria-hidden />
      </span>
      <h3 className="mb-1 text-lg font-bold">No users found</h3>
      <p className="mb-6 text-sm text-slate-500">
        {hasFilters
          ? 'No profiles match your current search and filter combination. Try adjusting or clearing some filters.'
          : 'There are currently no users in the directory database.'}
      </p>
      {hasFilters && (
        <button type="button" onClick={onReset} className="btn-primary">
          <RotateCcw className="size-4" aria-hidden />
          Clear all filters
        </button>
      )}
    </div>
  );
}
