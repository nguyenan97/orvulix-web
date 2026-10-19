import {
  checkAlgorithm,
  checkSize,
  isDigest,
  TIMEOUT_MS,
  type Algorithm
} from './model';

export interface HashWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(data: { file: File; algorithm: Algorithm }): void;
  terminate(): void;
}
const createWorker = () =>
  new Worker(new URL('./hash.worker.ts', import.meta.url), { type: 'module' });
export function runChecksum(
  file: File,
  algorithm: Algorithm,
  signal: AbortSignal,
  options: { createWorker?: () => HashWorker; timeoutMs?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      checkAlgorithm(algorithm);
      checkSize(file.size);
      if (signal.aborted) throw Error('Calculation cancelled.');
      if (globalThis.isSecureContext === false || !globalThis.crypto?.subtle)
        throw Error(
          'Web Crypto unavailable. Open this tool over HTTPS or localhost.'
        );
    } catch (error) {
      reject(error);
      return;
    }
    const started = performance.now();
    const timeout = options.timeoutMs ?? TIMEOUT_MS;
    let worker: HashWorker;
    try {
      worker = (options.createWorker ?? createWorker)();
    } catch {
      reject(Error('Could not start checksum worker. Try again.'));
      return;
    }
    let done = false;
    const finish = (digest?: string, error?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(Error(error));
      else resolve(digest!);
    };
    const abort = () => finish(undefined, 'Calculation cancelled.');
    const expired = () => performance.now() - started >= timeout;
    const timer = setTimeout(
      () => finish(undefined, 'Calculation timed out. Try a smaller file.'),
      Math.max(0, timeout - (performance.now() - started))
    );
    worker.onmessage = ({ data }) => {
      if (expired())
        finish(undefined, 'Calculation timed out. Try a smaller file.');
      else if (isDigest(data?.digest, algorithm)) finish(data.digest);
      else
        finish(
          undefined,
          'Could not calculate checksum. Try again with a smaller file.'
        );
    };
    worker.onerror = worker.onmessageerror = () =>
      finish(undefined, 'Checksum worker failed. Try again.');
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    if (expired()) {
      finish(undefined, 'Calculation timed out. Try a smaller file.');
      return;
    }
    try {
      worker.postMessage({ file, algorithm });
    } catch {
      finish(undefined, 'Could not read this file. Select it again.');
    }
  });
}
