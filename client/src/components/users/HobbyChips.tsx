import { useEffect, useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

const VISIBLE = 2;
const POPOVER_ROOM_PX = 140;

interface HobbyChipsProps {
  hobbies: string[];
  selected: string[];
  onToggle: (hobby: string) => void;
}

/**
 * Shows up to two hobbies, then "+n". Hobbies the visitor filters by come first,
 * so the card shows why it matched. "+n" opens a list of the rest.
 */
export function HobbyChips({ hobbies, selected, onToggle }: HobbyChipsProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(true);
  const moreRef = useRef<HTMLDivElement>(null);

  // Open upward by default; open downward when the list's top edge would cut it off.
  const toggle = () => {
    const button = moreRef.current;
    const list = button?.closest('[role=feed]');
    if (button && list) {
      setOpenUp(button.getBoundingClientRect().top - list.getBoundingClientRect().top > POPOVER_ROOM_PX);
    }
    setOpen((v) => !v);
  };

  const ordered = [...hobbies].sort((a, b) => Number(selected.includes(b)) - Number(selected.includes(a)));
  const shown = ordered.slice(0, VISIBLE);
  const rest = ordered.slice(VISIBLE);

  // Close on a click outside or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (hobbies.length === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-400 italic">
        <Sparkles className="size-3" aria-hidden /> No hobbies listed
      </span>
    );
  }

  return (
    <>
      {shown.map((hobby) => {
        const on = selected.includes(hobby);
        return (
          <button
            key={hobby}
            type="button"
            onClick={() => onToggle(hobby)}
            title={`Filter by hobby: ${hobby}`}
            className={`chip ${on ? 'chip-selected' : ''}`}
          >
            {on && <Check className="mr-1 size-3" aria-hidden />}
            {hobby}
          </button>
        );
      })}

      {rest.length > 0 && (
        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={`${rest.length} more hobbies`}
            title="Click to view all hobbies"
            className="chip-more"
          >
            +{rest.length}
          </button>

          {open && (
            <div className={`absolute left-0 z-30 ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 animate-pop-in rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white shadow-xl`}>
              <p className="mb-1.5 border-b border-slate-700 pb-1 font-semibold text-slate-300">
                Additional Hobbies ({rest.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {rest.map((hobby) => (
                  <button
                    key={hobby}
                    type="button"
                    onClick={() => {
                      onToggle(hobby);
                      setOpen(false);
                    }}
                    className={`cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      selected.includes(hobby) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {hobby}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
