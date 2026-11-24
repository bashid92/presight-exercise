import { useCallback, useEffect, useRef } from 'react';

/** Returns a debounced version of `callback` plus a `cancel` to drop a pending call. */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delay = 300) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args: Args) => {
      cancel();
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay, cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { debounced, cancel };
}
