import type { InitialValuesType } from '../../pages/tools/video/gif/images-to-gif/types';
export interface GifState {
  result: File | null;
  loading: boolean;
  error: string;
}
export type GifEncoder = (
  files: File[],
  options: InitialValuesType,
  signal: AbortSignal
) => Promise<File>;
const empty = (): GifState => ({ result: null, loading: false, error: '' });
/** Invalidates at edit time, not when the debounced encoder eventually starts. */
export class LatestGifJob {
  private generation = 0;
  private controller?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(
    private publish: (state: GifState) => void,
    private encode: GifEncoder
  ) {}
  private cancel() {
    this.generation++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.controller?.abort();
    this.controller = undefined;
  }
  invalidate() {
    this.cancel();
    this.publish(empty());
  }
  dispose() {
    this.cancel();
  }
  schedule(options: InitialValuesType, files: File[]) {
    this.invalidate();
    if (!files.length) return;
    const snapshot = { ...options };
    const inputs = [...files];
    const generation = this.generation;
    const controller = new AbortController();
    this.controller = controller;
    const current = () =>
      this.generation === generation && !controller.signal.aborted;
    this.timer = setTimeout(async () => {
      this.timer = undefined;
      if (!current()) return;
      this.publish({ result: null, loading: true, error: '' });
      try {
        const result = await this.encode(inputs, snapshot, controller.signal);
        if (current()) this.publish({ result, loading: false, error: '' });
      } catch {
        if (current())
          this.publish({
            result: null,
            loading: false,
            error:
              'GIF conversion failed. Try fewer or smaller supported images.'
          });
      }
    }, 1000);
  }
}
