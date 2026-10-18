import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export class PdfConversionError extends Error {}
export function checkPdfActive(signal: AbortSignal) {
  if (signal.aborted) throw signal.reason;
}

/** Own one PDF.js loading task, including failure, abort and deadline teardown. */
export async function withPdfDocument<T>(
  file: File,
  signal: AbortSignal | undefined,
  work: (pdf: PDFDocumentProxy, signal: AbortSignal) => Promise<T>
): Promise<T> {
  if (!file.size || file.size > 32 * 1024 * 1024)
    throw new PdfConversionError(
      'Choose a nonempty PDF within the 32 MiB input limit.'
    );
  if (file.name.length > 1024)
    throw new PdfConversionError('PDF filename limit is 1024 characters.');
  const controller = new AbortController();
  let task: ReturnType<typeof pdfjs.getDocument> | undefined;
  let destroyed = false;
  const destroy = async () => {
    if (task && !destroyed) {
      destroyed = true;
      await task.destroy();
    }
  };
  const cancel = () =>
    controller.abort(new PdfConversionError('PDF conversion cancelled.'));
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const timer = setTimeout(
    () =>
      controller.abort(
        new PdfConversionError(
          'PDF conversion exceeded the 30 second limit. Try fewer pages.'
        )
      ),
    30000
  );
  let abort: () => void = () => undefined;
  const cancelled = new Promise<never>((_, reject) => {
    abort = () => {
      reject(controller.signal.reason);
      void destroy().catch(() => undefined);
    };
    controller.signal.addEventListener('abort', abort, { once: true });
    if (controller.signal.aborted) abort();
  });
  const operation = async () => {
    try {
      checkPdfActive(controller.signal);
      const data = await file.arrayBuffer();
      checkPdfActive(controller.signal);
      task = pdfjs.getDocument({ data });
      const pdf = await task.promise;
      checkPdfActive(controller.signal);
      if (
        !Number.isInteger(pdf.numPages) ||
        pdf.numPages < 1 ||
        pdf.numPages > 500
      )
        throw new PdfConversionError('PDF page limit is 500 pages.');
      return await work(pdf, controller.signal);
    } finally {
      await destroy();
    }
  };
  try {
    return await Promise.race([operation(), cancelled]);
  } catch (error) {
    if (error instanceof PdfConversionError) throw error;
    throw new PdfConversionError(
      'PDF conversion failed. Choose a readable, unencrypted PDF within the displayed limits.'
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
    controller.signal.removeEventListener('abort', abort);
  }
}
