import { GifInputError } from './input-error';
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
/** One explicit encode at a time; cancellation discards ownership before settlement. */
export class LatestGifJob {
  private generation = 0;
  private controller?: AbortController;
  private active = false;
  constructor(
    private publish: (state: GifState) => void,
    private encode: GifEncoder,
    private onBusy: (busy: boolean) => void = () => {}
  ) {}
  private cancel() {
    this.generation++;
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
  async run(options: InitialValuesType, files: File[]) {
    if (this.active || !files.length) return;
    this.invalidate();
    const snapshot = { ...options };
    const inputs = [...files];
    const generation = this.generation;
    const controller = new AbortController();
    this.controller = controller;
    this.active = true;
    this.onBusy(true);
    const current = () =>
      this.generation === generation && !controller.signal.aborted;
    this.publish({ result: null, loading: true, error: '' });
    try {
      const result = await this.encode(inputs, snapshot, controller.signal);
      if (current()) this.publish({ result, loading: false, error: '' });
    } catch (error) {
      if (current())
        this.publish({
          result: null,
          loading: false,
          error:
            error instanceof GifInputError
              ? error.message
              : 'GIF conversion failed. Try fewer or smaller supported images.'
        });
    } finally {
      this.active = false;
      this.controller = undefined;
      this.onBusy(false);
    }
  }
}
