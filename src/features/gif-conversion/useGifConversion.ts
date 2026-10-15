import { useCallback, useEffect, useRef, useState } from 'react';
import { LatestGifJob, GifState } from './latest-job';
import { imagesToGif } from '../../pages/tools/video/gif/images-to-gif/service';
import type { InitialValuesType } from '../../pages/tools/video/gif/images-to-gif/types';
import type { MultiImageInput } from '../../components/input/ToolMultipleImageInput';
export function useGifConversion() {
  const [state, setState] = useState<GifState>({
    result: null,
    loading: false,
    error: ''
  });
  const mounted = useRef(true);
  const [job] = useState(
    () =>
      new LatestGifJob((value) => {
        if (mounted.current) setState(value);
      }, imagesToGif)
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      job.dispose();
    };
  }, [job]);
  const compute = useCallback(
    (options: InitialValuesType, input: MultiImageInput[]) =>
      job.schedule(
        options,
        input.map((item) => item.file)
      ),
    [job]
  );
  const invalidate = useCallback(() => job.invalidate(), [job]);
  return { ...state, compute, invalidate };
}
