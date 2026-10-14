import { captureHtml } from './renderer';
import { type PreparedHtml } from './sanitize';
import { type LayoutReport } from './layout';
import {
  abortError,
  checkAbort,
  LIMITS,
  safeFilename,
  type ImageOptions
} from './model';
import { pdfGeometry, PDF_LIMITS, type PdfOptions } from './pdf-model';

export function validateCapturedPng(bytes: Uint8Array, image: ImageOptions) {
  if (bytes.length > LIMITS.outputBytes)
    throw Error('Captured image exceeds 8 MiB.');
  if (
    bytes.length < 33 ||
    ![137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte
    ) ||
    String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR'
  )
    throw Error('The renderer did not produce a valid PNG.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    view.getUint32(8) !== 13 ||
    view.getUint32(16) !== image.width * image.scale ||
    view.getUint32(20) !== image.height * image.scale
  )
    throw Error('Captured PNG dimensions do not match the bounded viewport.');
}
export function checkPdfOutput(blob: Blob) {
  if (blob.type !== 'application/pdf' || !blob.size)
    throw Error('The browser could not encode the PDF.');
  if (blob.size > PDF_LIMITS.outputBytes)
    throw Error('PDF exceeds the 8 MiB output limit.');
}
/** Async packaging deadline; synchronous jsPDF work is bounded but not preemptible. */
export async function assemblePdf(
  png: File,
  image: ImageOptions,
  options: PdfOptions,
  signal: AbortSignal
): Promise<File> {
  const geometry = pdfGeometry(options, image);
  checkAbort(signal);
  if (png.type !== 'image/png' || png.size > LIMITS.outputBytes)
    throw Error('PDF requires a PNG capture of at most 8 MiB.');
  let active = true;
  const deadline = performance.now() + PDF_LIMITS.timeoutMs;
  const timeoutError = () =>
    Error('PDF encoding timed out. Retry with simpler HTML.');
  const checkActive = () => {
    checkAbort(signal);
    if (!active) throw abortError();
    if (performance.now() > deadline) throw timeoutError();
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let removeAbort = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener('abort', abort, { once: true });
    removeAbort = () => signal.removeEventListener('abort', abort);
    timer = setTimeout(() => reject(timeoutError()), PDF_LIMITS.timeoutMs);
  });
  const work = async () => {
    const bytes = new Uint8Array(await png.arrayBuffer());
    checkActive();
    validateCapturedPng(bytes, image);
    const { default: jsPDF } = await import('jspdf');
    checkActive();
    const pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'mm',
      format: options.paper,
      compress: true,
      putOnlyUsedFonts: true
    });
    pdf.addImage(
      bytes,
      'PNG',
      geometry.x,
      geometry.y,
      geometry.width,
      geometry.height
    );
    checkActive();
    const blob = pdf.output('blob');
    checkActive();
    checkPdfOutput(blob);
    return new File([blob], safeFilename(image.filename, 'pdf'), {
      type: 'application/pdf'
    });
  };
  try {
    return await Promise.race([work(), interrupted]);
  } finally {
    active = false;
    clearTimeout(timer);
    removeAbort();
  }
}
export async function capturePdf(
  prepared: PreparedHtml,
  image: ImageOptions,
  options: PdfOptions,
  signal: AbortSignal,
  onLayout?: (report: LayoutReport) => void
) {
  pdfGeometry(options, image);
  const png = await captureHtml(prepared, image, signal, onLayout);
  checkAbort(signal);
  return assemblePdf(png, image, options, signal);
}
