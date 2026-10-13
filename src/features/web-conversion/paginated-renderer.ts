import { type PreparedHtml } from './sanitize';
import { validateEmbeddedImages } from './assets';
import {
  checkAbort,
  abortError,
  safeFilename,
  type ImageOptions,
  LIMITS
} from './model';
import { type PdfOptions, PDF_LIMITS } from './pdf-model';
import {
  planPagination,
  PAGINATION_LIMITS,
  type PaginationPlan
} from './pagination';
import { paginatedDocument, measureDocument } from './pagination-layout';
import { checkPdfOutput, validateCapturedPng } from './pdf-renderer';

export interface PaginationProgress {
  stage: 'measuring' | 'capturing' | 'encoding';
  page: number;
  total: number;
}
export async function runPaginated(
  prepared: PreparedHtml,
  image: ImageOptions,
  options: PdfOptions,
  signal: AbortSignal,
  exportPdf: boolean,
  onPlan?: (plan: PaginationPlan) => void,
  onProgress?: (progress: PaginationProgress) => void
): Promise<{ plan: PaginationPlan; file?: File }> {
  // Reject invalid options before native decode/layout or module loading.
  planPagination({ height: 1, extent: 1, blocks: [] }, image, options);
  checkAbort(signal);
  if (prepared.assets.length)
    await validateEmbeddedImages(prepared.assets, signal);
  checkAbort(signal);
  const deadline = performance.now() + PAGINATION_LIMITS.timeoutMs;
  let active = true;
  const frame = document.createElement('iframe');
  frame.dataset.htmlRenderer = 'true';
  frame.title = 'Temporary pagination renderer';
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${image.width}px`,
    height: '100px',
    border: '0'
  });
  const timeout = () =>
    Error('Pagination timed out. Reduce content or raster scale.');
  const check = () => {
    checkAbort(signal);
    if (!active) throw abortError();
    if (performance.now() > deadline) throw timeout();
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let removeAbort = () => {};
  let canvas: HTMLCanvasElement | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    const abort = () => {
      active = false;
      frame.remove();
      reject(abortError());
    };
    signal.addEventListener('abort', abort, { once: true });
    removeAbort = () => signal.removeEventListener('abort', abort);
    timer = setTimeout(() => {
      active = false;
      frame.remove();
      reject(timeout());
    }, PAGINATION_LIMITS.timeoutMs);
  });
  try {
    const ready = new Promise<void>((resolve, reject) => {
      frame.onload = () => resolve();
      frame.onerror = () =>
        reject(Error('Could not prepare pagination frame.'));
    });
    frame.srcdoc = paginatedDocument(prepared);
    document.body.append(frame);
    const work = async () => {
      onProgress?.({ stage: 'measuring', page: 0, total: 0 });
      await ready;
      check();
      const body = frame.contentDocument?.body;
      const source = body?.querySelector<HTMLElement>('[data-page-source]');
      if (!body || !source) throw Error('Pagination frame is unavailable.');
      // Data images must finish loading before measurement; no external fonts.
      await Promise.all(
        [...source.querySelectorAll('img')].map((img) => img.decode())
      );
      check();
      const plan = planPagination(
        measureDocument(source, image.width),
        image,
        options
      );
      check();
      onPlan?.(plan);
      if (!exportPdf) return { plan };
      const { toCanvas } = await import('html-to-image');
      check();
      const file = await assemblePaginatedPdf(
        plan,
        image,
        options,
        signal,
        async (slice, index) => {
          check();
          onProgress?.({
            stage: 'capturing',
            page: index + 1,
            total: plan.pages.length
          });
          const height = slice.end - slice.start;
          frame.style.height = `${height}px`;
          body.style.height = `${height}px`;
          source.style.transform = `translateY(-${slice.start}px)`;
          const captured = await toCanvas(body, {
            width: image.width,
            height,
            canvasWidth: image.width,
            canvasHeight: height,
            pixelRatio: image.scale,
            skipAutoScale: true,
            skipFonts: true,
            backgroundColor:
              image.background === 'white' ? '#ffffff' : undefined
          });
          if (!active || signal.aborted || performance.now() > deadline) {
            captured.width = captured.height = 0;
            check();
          }
          canvas = captured;
          try {
            const blob = await new Promise<Blob>((resolve, reject) =>
              captured.toBlob(
                (b) =>
                  b ? resolve(b) : reject(Error('Could not encode page PNG.')),
                'image/png'
              )
            );
            check();
            return blob;
          } finally {
            captured.width = captured.height = 0;
            canvas = undefined;
          }
        },
        check,
        (page, total) => onProgress?.({ stage: 'encoding', page, total })
      );
      check();
      onProgress?.({
        stage: 'encoding',
        page: plan.pages.length,
        total: plan.pages.length
      });
      return { plan, file };
    };
    return await Promise.race([work(), interrupted]);
  } finally {
    active = false;
    clearTimeout(timer);
    removeAbort();
    frame.onload = frame.onerror = null;
    frame.remove();
    if (canvas) canvas.width = canvas.height = 0;
  }
}

/** Sequential capture/assembly contract. Plans are validated again at this boundary. */
export async function assemblePaginatedPdf(
  plan: PaginationPlan,
  image: ImageOptions,
  options: PdfOptions,
  signal: AbortSignal,
  capture: (
    slice: import('./pagination').PageSlice,
    index: number
  ) => Promise<Blob>,
  checkDeadline: () => void = () => {},
  onEncoding?: (page: number, total: number) => void
): Promise<File> {
  const deadline = performance.now() + PAGINATION_LIMITS.timeoutMs;
  const check = () => {
    checkAbort(signal);
    checkDeadline();
    if (performance.now() > deadline)
      throw Error('Pagination encoding timed out.');
  };
  // Rebuild from trusted numeric bounds rather than accepting arbitrary placement.
  const expected = planPagination(
    {
      height: plan.pages[plan.pages.length - 1]?.end ?? 0,
      extent: plan.pages[plan.pages.length - 1]?.end ?? 0,
      blocks: []
    },
    image,
    options
  );
  if (
    plan.width !== expected.width ||
    plan.scale !== expected.scale ||
    plan.x !== expected.x ||
    plan.y !== expected.y ||
    plan.mmPerCssPixel !== expected.mmPerCssPixel ||
    plan.pageWidth !== expected.pageWidth ||
    plan.pageHeight !== expected.pageHeight ||
    plan.capacity !== expected.capacity ||
    !plan.pages.length ||
    plan.pages.length > PAGINATION_LIMITS.pages
  )
    throw Error('Invalid pagination plan.');
  let previous = 0,
    pixels = 0;
  for (const slice of plan.pages) {
    if (
      !Number.isInteger(slice.start) ||
      !Number.isInteger(slice.end) ||
      slice.start !== previous ||
      slice.end <= slice.start ||
      slice.end - slice.start > plan.capacity ||
      !['end', 'boundary', 'capacity'].includes(slice.reason)
    )
      throw Error('Invalid pagination page bounds.');
    const count = image.width * (slice.end - slice.start) * image.scale ** 2;
    pixels += count;
    if (
      count > PAGINATION_LIMITS.pagePixels ||
      pixels > PAGINATION_LIMITS.totalPixels
    )
      throw Error('Pagination raster budget exceeded.');
    previous = slice.end;
  }
  check();
  const { default: jsPDF } = await import('jspdf');
  check();
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.paper,
    compress: true,
    putOnlyUsedFonts: true
  });
  let pngBytes = 0;
  for (const [index, slice] of plan.pages.entries()) {
    check();
    const blob = await capture(slice, index);
    check();
    pngBytes += blob.size;
    if (
      blob.type !== 'image/png' ||
      blob.size > LIMITS.outputBytes ||
      pngBytes > PDF_LIMITS.outputBytes
    )
      throw Error('Page captures exceed the 8 MiB cumulative byte limit.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    check();
    const height = slice.end - slice.start;
    validateCapturedPng(bytes, { ...image, height });
    if (index) pdf.addPage(options.paper, options.orientation);
    onEncoding?.(index + 1, plan.pages.length);
    pdf.addImage(
      bytes,
      'PNG',
      plan.x,
      plan.y,
      image.width * plan.mmPerCssPixel,
      height * plan.mmPerCssPixel,
      undefined,
      'FAST'
    );
    check();
    checkPdfOutput(pdf.output('blob'));
    check();
  }
  const blob = pdf.output('blob');
  check();
  checkPdfOutput(blob);
  return new File([blob], safeFilename(image.filename, 'pdf'), {
    type: 'application/pdf'
  });
}
