import { useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import type { DebouncedFunc } from 'lodash';

/** Stable queued work, latest callback, and owned pending-timer cleanup. */
export default function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): DebouncedFunc<T> {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  const debounced = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>): ReturnType<T> => callbackRef.current(...args),
        delay
      ),
    [delay]
  );
  useEffect(() => () => debounced.cancel(), [debounced]);
  return debounced;
}
