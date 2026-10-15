import { PDFDocument } from 'pdf-lib';
import { validateBatch } from '../multifile-drop/policy';

export const MERGE_LIMITS = {
  pages: 500,
  outputBytes: 64 * 1024 * 1024,
  elapsedMs: 30_000
} as const;

/** Cooperative checkpoints, not a hard CPU/memory quota or PDF sanitizer. */
export async function mergeDocuments(
  files: readonly File[],
  signal?: AbortSignal
): Promise<File> {
  const started = performance.now();
  const check = () => {
    signal?.throwIfAborted();
    if (performance.now() - started >= MERGE_LIMITS.elapsedMs)
      throw Error('PDF merge timed out. Try fewer or smaller PDFs.');
  };
  check();
  validateBatch(files, [], 'pdf', ['application/pdf']);
  const snapshot = [...files];
  const merged = await PDFDocument.create();
  check();
  for (const file of snapshot) {
    const bytes = await file.arrayBuffer();
    check();
    const source = await PDFDocument.load(bytes);
    check();
    const count = source.getPageCount();
    if (!count) throw Error('Each PDF must contain at least one page.');
    if (merged.getPageCount() + count > MERGE_LIMITS.pages)
      throw Error(`Merge at most ${MERGE_LIMITS.pages} pages at a time.`);
    const pages = await merged.copyPages(source, source.getPageIndices());
    check();
    for (const page of pages) {
      check();
      merged.addPage(page);
    }
  }
  check();
  const bytes = await merged.save();
  check();
  if (bytes.byteLength > MERGE_LIMITS.outputBytes)
    throw Error('Merged PDF exceeds 64 MiB. Try fewer or smaller PDFs.');
  return new File([new Uint8Array(bytes)], 'merged.pdf', {
    type: 'application/pdf'
  });
}
