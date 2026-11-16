import { checkSize, LIMITS } from './png';
export interface PngWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(data: { file: File }): void;
  terminate(): void;
}
export function runOptimization(
  file: File,
  signal: AbortSignal,
  options: { createWorker?: () => PngWorker; timeoutMs?: number } = {}
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      checkSize(file.size);
      signal.throwIfAborted();
    } catch (error) {
      reject(error);
      return;
    }
    const started = performance.now(),
      timeout = options.timeoutMs ?? LIMITS.timeout;
    let worker: PngWorker;
    try {
      worker =
        options.createWorker?.() ??
        new Worker(new URL('./optimize.worker.ts', import.meta.url), {
          type: 'module'
        });
    } catch {
      reject(Error('Could not start PNG worker. Try again.'));
      return;
    }
    let done = false;
    const finish = (bytes?: ArrayBuffer, error?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(Error(error));
      else resolve(bytes!);
    };
    const abort = () => finish(undefined, 'PNG optimization cancelled.');
    const expired = () => performance.now() - started >= timeout;
    const timer = setTimeout(
      () =>
        finish(undefined, 'PNG optimization timed out. Try a smaller file.'),
      Math.max(0, timeout - (performance.now() - started))
    );
    worker.onmessage = ({ data }) => {
      if (expired())
        finish(undefined, 'PNG optimization timed out. Try a smaller file.');
      else if (
        data?.bytes instanceof ArrayBuffer &&
        data.bytes.byteLength >= 45 &&
        data.bytes.byteLength <= file.size
      )
        finish(data.bytes);
      else
        finish(
          undefined,
          typeof data?.error === 'string'
            ? data.error.slice(0, 240)
            : 'Invalid PNG worker result. Try again.'
        );
    };
    worker.onerror = worker.onmessageerror = () =>
      finish(undefined, 'PNG worker failed. Try again.');
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    if (expired()) {
      finish(undefined, 'PNG optimization timed out. Try a smaller file.');
      return;
    }
    try {
      worker.postMessage({ file });
    } catch {
      finish(undefined, 'Could not read this file. Select it again.');
    }
  });
}
