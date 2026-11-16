import { executeString } from './execute';
import type { StringRequest } from './model';
self.onmessage = ({ data }: MessageEvent<StringRequest>) => {
  try {
    self.postMessage({ ok: true, result: executeString(data) });
  } catch (error) {
    self.postMessage({
      ok: false,
      error:
        error instanceof Error ? error.message : 'String processing failed.'
    });
  }
};
