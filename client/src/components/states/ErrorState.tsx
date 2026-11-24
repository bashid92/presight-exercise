import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message = 'Failed to load user directory data from server.', onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="mx-auto my-8 max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
      <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h3 className="mb-1 text-base font-bold text-rose-900">Unable to load data</h3>
      <p className="mb-5 text-sm text-rose-700">{message}</p>
      <button type="button" onClick={onRetry} className="btn-danger">
        <RefreshCw className="size-4" aria-hidden />
        Try Again
      </button>
    </div>
  );
}
