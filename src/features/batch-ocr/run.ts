import { createEngine } from './engine';
import {
  imageBytes,
  language,
  MAX_TEXT,
  MAX_TOTAL_TEXT,
  validateSelection
} from './policy';
export type Result = { texts: string[]; txt: Blob; zip: Blob };
export async function runBatch(
  files: readonly File[],
  selected: string,
  signal: AbortSignal,
  progress: (value: string) => void
): Promise<Result> {
  const lang = language(selected);
  validateSelection(files);
  signal.throwIfAborted();
  // Preflight every bounded header before any native image codec sees the batch.
  const images: Uint8Array[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    signal.throwIfAborted();
    images.push(imageBytes(bytes));
  }
  let stage = 'Loading OCR engine and selected language models';
  const engine = createEngine(signal, (message) =>
    progress(`${stage}: ${message}`)
  );
  const texts: string[] = [];
  let total = 0;
  try {
    progress('Loading OCR engine and selected language models');
    await engine.initialize(lang);
    for (let i = 0; i < images.length; i++) {
      signal.throwIfAborted();
      stage = `Recognizing image ${i + 1} of ${images.length}`;
      progress(stage);
      const text = await engine.recognize(images[i]);
      if (text.length > MAX_TEXT || (total += text.length) > MAX_TOTAL_TEXT)
        throw Error(
          'OCR text exceeds the batch output limit. Try fewer or smaller images.'
        );
      texts.push(text);
    }
  } finally {
    engine.close();
  }
  signal.throwIfAborted();
  progress('Preparing ordered downloads');
  const zip = await archive(
    files.map((f) => f.name),
    texts,
    signal
  );
  signal.throwIfAborted();
  const txt = new Blob(
    [
      texts
        .map(
          (text, i) =>
            `=== ${i + 1}. ${files[i].name.replace(
              /[\r\n]/g,
              ' '
            )} ===\n${text}`
        )
        .join('\n\n')
    ],
    { type: 'text/plain;charset=utf-8' }
  );
  return { texts, txt, zip };
}
function archive(names: string[], texts: string[], signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<Blob>((resolve, reject) => {
    const worker = new Worker(new URL('./archive.worker.ts', import.meta.url), {
      type: 'module'
    });
    let settled = false;
    const finish = (error?: Error, bytes?: ArrayBuffer) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      signal.removeEventListener('abort', abort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      if (error) reject(error);
      else resolve(new Blob([bytes!], { type: 'application/zip' }));
    };
    const abort = () =>
      finish(new DOMException('OCR cancelled.', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () =>
      finish(new Error('Could not create text ZIP. Retry with fewer images.'));
    worker.onmessageerror = () => finish(new Error('Unreadable ZIP response.'));
    worker.onmessage = ({ data }) => {
      if (
        !(data?.bytes instanceof ArrayBuffer) ||
        data.bytes.byteLength > 2_100_000 ||
        data.bytes.byteLength < 22 ||
        new DataView(data.bytes).getUint32(0) !== 0x504b0304
      )
        finish(new Error('Invalid or oversized ZIP output.'));
      else finish(undefined, data.bytes);
    };
    try {
      worker.postMessage({ names, texts });
    } catch {
      finish(new Error('Could not start ZIP export.'));
    }
  });
}
