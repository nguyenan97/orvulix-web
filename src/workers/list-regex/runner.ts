import {
  checkOutput,
  checkRequest,
  LIST_LIMITS,
  type ListRequest
} from './model';
export interface ListWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(request: ListRequest): void;
  terminate(): void;
}
const createWorker = () =>
  new Worker(new URL('./list.worker.ts', import.meta.url), { type: 'module' });
export function runList(
  request: ListRequest,
  signal: AbortSignal,
  options: { createWorker?: () => ListWorker; timeoutMs?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      checkRequest(request);
    } catch (error) {
      reject(error);
      return;
    }
    if (signal.aborted) {
      reject(new Error('List processing cancelled.'));
      return;
    }
    let worker: ListWorker;
    try {
      worker = (options.createWorker ?? createWorker)();
    } catch {
      reject(
        new Error(
          'Could not start the list worker. Check browser support and worker permissions.'
        )
      );
      return;
    }
    let done = false;
    const finish = (result?: string, error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(error);
      else resolve(result!);
    };
    const abort = () =>
      finish(undefined, new Error('List processing cancelled.'));
    const timer = setTimeout(
      () =>
        finish(
          undefined,
          new Error(
            'List processing timed out. Simplify the regex or shorten the input.'
          )
        ),
      options.timeoutMs ?? LIST_LIMITS.timeoutMs
    );
    worker.onmessage = ({ data }) => {
      if (data?.ok !== true) {
        finish(
          undefined,
          new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Invalid list worker response.'
          )
        );
        return;
      }
      try {
        checkOutput(data.result);
        finish(data.result);
      } catch (error) {
        finish(undefined, error as Error);
      }
    };
    worker.onerror = () =>
      finish(
        undefined,
        new Error('The list worker failed. Try a simpler expression.')
      );
    worker.onmessageerror = () =>
      finish(undefined, new Error('Invalid list worker message.'));
    signal.addEventListener('abort', abort, { once: true });
    try {
      worker.postMessage(request);
    } catch {
      finish(undefined, new Error('Could not send input to the list worker.'));
    }
  });
}
