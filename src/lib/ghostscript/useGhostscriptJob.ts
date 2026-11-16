import { useCallback, useEffect, useRef, useState } from 'react';

export function useGhostscriptJob<Options>(
  convert: (file: File, options: Options, signal: AbortSignal) => Promise<File>
) {
  const [state, setState] = useState<{
    result: File | null;
    loading: boolean;
    error: string;
  }>({ result: null, loading: false, error: '' });
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const invalidate = useCallback(() => {
    active.current?.abort();
    active.current = null;
    if (mounted.current) setState({ result: null, loading: false, error: '' });
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
    async (options: Options, file: File | null) => {
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
        const result = await convert(file, options, controller.signal);
        if (current()) setState({ result, loading: false, error: '' });
      } catch (error) {
        if (current())
          setState({
            result: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'PDF processing failed. Try another PDF.'
          });
      } finally {
        if (active.current === controller) active.current = null;
      }
    },
    [convert, invalidate]
  );
  return { ...state, compute, invalidate };
}
