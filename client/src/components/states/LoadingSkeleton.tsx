/** Grey placeholder cards in the shape of a user card, shown while page 1 loads. */
export function LoadingSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading users" className="grid grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel flex h-40 animate-pulse flex-col justify-between p-4">
          <div className="flex items-start gap-3.5">
            <div className="size-16 shrink-0 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="flex justify-between">
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="h-3 w-1/4 rounded bg-slate-200" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <div className="h-6 w-20 rounded-full bg-slate-200" />
            <div className="h-6 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
