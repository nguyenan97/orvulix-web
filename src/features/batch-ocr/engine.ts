import workerUrl from 'tesseract.js/dist/worker.min.js?url';
import coreUrl from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
import type { Language } from './policy';

// Isolated adapter for the installed Tesseract.js 6.0.1 worker protocol.
// Owning the actual worker immediately makes model-startup cancellation reliable.
export function createEngine(
  signal: AbortSignal,
  progress: (value: string) => void,
  factory: () => Worker = () => new Worker(workerUrl)
) {
  signal.throwIfAborted();
  const worker = factory();
  let nextId = 0;
  let pending:
    | {
        id: string;
        action: string;
        resolve: (data: unknown) => void;
        reject: (error: Error) => void;
      }
    | undefined;
  let closed = false;
  function close(error = new Error('OCR worker stopped.')) {
    if (closed) return;
    closed = true;
    signal.removeEventListener('abort', abort);
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
    pending?.reject(error);
    pending = undefined;
  }
  const abort = () => close(new DOMException('OCR cancelled.', 'AbortError'));
  signal.addEventListener('abort', abort, { once: true });
  worker.onerror = () =>
    close(new Error('OCR engine failed. Check network access and try again.'));
  worker.onmessageerror = () =>
    close(new Error('Unreadable OCR worker response.'));
  worker.onmessage = ({ data }) => {
    if (
      closed ||
      !pending ||
      data?.jobId !== pending.id ||
      data?.action !== pending.action
    )
      return;
    if (data.status === 'progress') {
      const fraction = data.data?.progress;
      progress(
        `${String(data.data?.status ?? 'Processing').slice(0, 80)}${
          typeof fraction === 'number' && Number.isFinite(fraction)
            ? ` ${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`
            : ''
        }`
      );
    } else if (data.status === 'resolve') {
      const resolve = pending.resolve;
      pending = undefined;
      resolve(data.data);
    } else if (data.status === 'reject') {
      close(
        new Error(
          'OCR could not process this batch. Check the image files and model network access, then retry.'
        )
      );
    }
  };
  function job(action: string, payload: unknown) {
    if (closed) return Promise.reject(new Error('OCR worker stopped.'));
    if (pending)
      return Promise.reject(new Error('OCR jobs must run sequentially.'));
    return new Promise<unknown>((resolve, reject) => {
      const id = String(++nextId);
      pending = { id, action, resolve, reject };
      try {
        worker.postMessage({ workerId: 'batch', jobId: id, action, payload });
      } catch {
        close(new Error('Could not send this image to the OCR worker.'));
      }
    });
  }
  return {
    close,
    async initialize(lang: Language) {
      await job('load', {
        options: {
          lstmOnly: true,
          corePath: new URL(coreUrl, location.href).href,
          logging: false
        }
      });
      // Explicit pinned paths per language; no IndexedDB model reads/writes.
      for (const code of lang.split('+')) {
        await job('loadLanguage', {
          langs: code,
          options: {
            langPath: `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${code}@1.0.0/4.0.0_best_int`,
            cacheMethod: 'none',
            gzip: true,
            lstmOnly: true
          }
        });
      }
      // Vietnamese first retains diacritics better on mixed Latin-script batches.
      await job('initialize', {
        langs: lang === 'eng+vie' ? 'vie+eng' : lang,
        oem: 1,
        config: {}
      });
    },
    async recognize(image: Uint8Array) {
      const data = await job('recognize', {
        image,
        options: {},
        output: { text: true }
      });
      if (!data || typeof (data as { text?: unknown }).text !== 'string')
        throw Error('Invalid OCR text response.');
      return (data as { text: string }).text;
    }
  };
}
