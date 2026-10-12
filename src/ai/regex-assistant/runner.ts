import {
  checkRegexInput,
  REGEX_LIMITS,
  type RegexInput,
  type RegexResult
} from './engine';
export interface RegexWorker {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(input: RegexInput): void;
  terminate(): void;
}
const createWorker = () =>
  new Worker(new URL('./regex.worker.ts', import.meta.url), { type: 'module' });

/** One worker per run. Always terminate on completion, error, abort or timeout. */
export function runRegex(
  input: RegexInput,
  signal?: AbortSignal,
  options: { createWorker?: () => RegexWorker; timeoutMs?: number } = {}
): Promise<RegexResult> {
  return new Promise((resolve, reject) => {
    try {
      checkRegexInput(input);
    } catch (error) {
      reject(error);
      return;
    }
    if (signal?.aborted) {
      reject(new Error('Regex test cancelled.'));
      return;
    }
    let worker: RegexWorker;
    try {
      worker = (options.createWorker ?? createWorker)();
    } catch {
      reject(
        new Error(
          'Could not start the local regex worker. Check browser support and site worker permissions.'
        )
      );
      return;
    }
    let done = false;
    const finish = (result?: RegexResult, error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
      if (error) reject(error);
      else resolve(result!);
    };
    const abort = () => finish(undefined, new Error('Regex test cancelled.'));
    const timer = setTimeout(
      () =>
        finish(
          undefined,
          new Error(
            'Regex test timed out; the worker was stopped. Simplify the pattern or shorten the text.'
          )
        ),
      options.timeoutMs ?? REGEX_LIMITS.timeoutMs
    );
    worker.onmessage = (event) => {
      const data = event.data;
      if (
        data?.ok === true &&
        Array.isArray(data.result?.matches) &&
        typeof data.result.truncated === 'boolean'
      )
        finish(data.result);
      else
        finish(
          undefined,
          new Error(
            typeof data?.error === 'string'
              ? data.error
              : 'Invalid worker response.'
          )
        );
    };
    worker.onerror = () =>
      finish(
        undefined,
        new Error('The local regex worker failed. Try a simpler expression.')
      );
    signal?.addEventListener('abort', abort, { once: true });
    try {
      worker.postMessage(input);
    } catch {
      finish(undefined, new Error('Could not send input to the local worker.'));
    }
  });
}
