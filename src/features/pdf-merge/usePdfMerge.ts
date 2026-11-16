import { useCallback, useEffect, useRef, useState } from 'react';
import { mergePdf } from '../../pages/tools/pdf/merge-pdf/service';
import type { MultiPdfInput } from '../../components/input/ToolMultiplePdfInput';

interface MergeState {
  result: File | null;
  loading: boolean;
  error: string;
}
const empty = (): MergeState => ({ result: null, loading: false, error: '' });
export function usePdfMerge() {
  const [state, setState] = useState<MergeState>(empty);
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
    async (_options: File[], input: MultiPdfInput[]) => {
      invalidate();
      if (!input.length || !mounted.current) return;
      const controller = new AbortController();
      active.current = controller;
      const current = () =>
        mounted.current &&
        active.current === controller &&
        !controller.signal.aborted;
      setState({ result: null, loading: true, error: '' });
      try {
        const result = await mergePdf(
          input.map((item) => item.file),
          controller.signal
        );
        if (current()) setState({ result, loading: false, error: '' });
      } catch {
        if (current())
          setState({
            result: null,
            loading: false,
            error:
              'PDF merge failed. Use readable, unencrypted PDFs within the displayed limits, or try fewer pages.'
          });
      } finally {
        if (active.current === controller) active.current = null;
      }
    },
    [invalidate]
  );
  return { ...state, compute, invalidate };
}
