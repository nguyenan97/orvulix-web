import { executeList } from './execute';
import type { ListRequest } from './model';
self.onmessage = (event: MessageEvent<ListRequest>) => {
  try {
    self.postMessage({ ok: true, result: executeList(event.data) });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'List processing failed.'
    });
  }
};
