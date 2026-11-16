import { checkOutput, checkRequest, type StringRequest } from './model';
export interface StringWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(request: StringRequest): void;
  terminate(): void;
}
const createWorker = () =>
  new Worker(new URL('./string.worker.ts', import.meta.url), {
    type: 'module'
  });
export function runString(
  request: StringRequest,
  signal: AbortSignal,
  options: { createWorker?: () => StringWorker; timeoutMs?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      checkRequest(request);
    } catch (error) {
      reject(error);
      return;
    }
    if (signal.aborted) {
      reject(new Error('String processing cancelled.'));
      return;
    }
    let worker: StringWorker;
    try {
      worker = (options.createWorker ?? createWorker)();
    } catch {
      reject(
        new Error(
          'Could not start the string worker. Check browser worker permissions.'
        )
      );
      return;
    }
    let done = false;
    const finish = (value?: string, error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(error);
      else resolve(value!);
    };
    const abort = () =>
      finish(undefined, new Error('String processing cancelled.'));
    const timer = setTimeout(
      () =>
        finish(
          undefined,
          new Error(
            'String processing timed out. Simplify the regex or shorten the input.'
          )
        ),
      options.timeoutMs ?? 2000
    );
    worker.onmessage = ({ data }) => {
      if (data?.ok !== true) {
        finish(
          undefined,
          new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Invalid string worker response.'
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
    worker.onerror = (event) => {
      event.preventDefault();
      finish(
        undefined,
        new Error('String worker failed. Simplify the expression or try again.')
      );
    };
    worker.onmessageerror = () =>
      finish(undefined, new Error('Invalid string worker message.'));
    signal.addEventListener('abort', abort, { once: true });
    try {
      worker.postMessage(request);
    } catch {
      finish(
        undefined,
        new Error('Could not send input to the string worker.')
      );
    }
  });
}
