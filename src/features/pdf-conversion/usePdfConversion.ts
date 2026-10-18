import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = { result: T | null; loading: boolean; error: string };
const empty = <T>(): State<T> => ({ result: null, loading: false, error: '' });

/** Same current-job ownership pattern as usePdfMerge, for the two converters. */
export function usePdfConversion<T>(
  convert: (file: File, signal: AbortSignal) => Promise<T>
) {
  const [state, setState] = useState<State<T>>(empty);
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const invalidate = useCallback(() => {
    active.current?.abort();
    active.current = null;
    if (mounted.current) setState(empty());
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
      active.current = null;
    };
  }, []);
  const compute = useCallback(
    async (_options: object, file: File | null) => {
      invalidate();
      if (!file || !mounted.current) return;
      const controller = new AbortController();
      active.current = controller;
      const current = () =>
        mounted.current &&
        active.current === controller &&
        !controller.signal.aborted;
      setState({ result: null, loading: true, error: '' });
      try {
        const result = await convert(file, controller.signal);
        if (current()) setState({ result, loading: false, error: '' });
      } catch (error) {
        if (current())
          setState({
            result: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'PDF conversion failed. Try a different PDF.'
          });
      } finally {
        if (active.current === controller) active.current = null;
      }
    },
    [convert, invalidate]
  );
  return { ...state, compute, invalidate };
}
