import { useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { FilterSidebar, FilterSidebarProps } from './FilterSidebar';

interface MobileFilterDrawerProps extends FilterSidebarProps {
  open: boolean;
  total: number;
  onClose: () => void;
}

/** Slide-in filter panel for screens narrower than the desktop sidebar breakpoint. */
export function MobileFilterDrawer({ open, total, onClose, ...sidebar }: MobileFilterDrawerProps) {
  // Escape closes it and the page behind does not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-xs animate-pop-in flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Filter className="size-4 text-blue-600" aria-hidden />
            Filters
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FilterSidebar {...sidebar} bare />
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <button type="button" onClick={onClose} className="btn-primary w-full py-2.5 text-xs">
            View {total.toLocaleString()} Results
          </button>
        </div>
      </div>
    </div>
  );
}
