import { rasterHeight, validateTableHeaders } from './table-header-model';
import { measureTableHeaders, composeHeaderPage } from './table-headers';
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
import {
  ALL_PAGES,
  selectedSourcePages,
  parsePageRanges,
  type PageSelection
} from './page-ranges';

export interface PaginationProgress {
  stage: 'measuring' | 'capturing' | 'encoding';
  page: number;
  sourcePage?: number;
  total: number;
}
export async function runPaginated(
  prepared: PreparedHtml,
  image: ImageOptions,
  options: PdfOptions,
  signal: AbortSignal,
  exportPdf: boolean,
  onPlan?: (plan: PaginationPlan) => void,
  onProgress?: (progress: PaginationProgress) => void,
  selection: PageSelection = ALL_PAGES,
  repeatHeaders = false
): Promise<{ plan: PaginationPlan; file?: File }> {
  // Reject invalid options before native decode/layout or module loading.
  planPagination({ height: 1, extent: 1, blocks: [] }, image, options);
  checkAbort(signal);
  if (selection.mode === 'custom') parsePageRanges(selection.expression);
  else if (selection.mode !== 'all')
    throw Error('Unsupported page selection mode.');
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
      const layout = measureDocument(source, image.width);
      if (layout.extent > PAGINATION_LIMITS.documentHeight)
        throw Error('Document geometry exceeds the 10000 CSS pixel limit.');
      if (repeatHeaders) {
        layout.tables = await measureTableHeaders(source, check);
        layout.height = Math.max(
          layout.height,
          ...layout.tables.map((t) => t.bottom)
        );
        layout.extent = Math.max(layout.extent, layout.height);
      }
      const plan = planPagination(layout, image, options, repeatHeaders);
      check();
      const selected = selectedSourcePages(selection, plan.pages.length);
      onPlan?.(plan);
      check();
      if (!exportPdf) return { plan };
      const { toCanvas } = await import('html-to-image');
      check();
      const file = await assemblePaginatedPdf(
        plan,
        image,
        options,
        signal,
        async (slice, index, sourcePage) => {
          check();
          onProgress?.({
            stage: 'capturing',
            page: index + 1,
            sourcePage,
            total: selected.length
          });
          const height = rasterHeight(slice);
          frame.style.height = `${height}px`;
          body.style.height = `${height}px`;
          if (plan.tables) await composeHeaderPage(body, plan, slice, check);
          else source.style.transform = `translateY(-${slice.start}px)`;
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
        (page, total, sourcePage) =>
          onProgress?.({ stage: 'encoding', page, total, sourcePage }),
        selection
      );
      check();
      onProgress?.({
        stage: 'encoding',
        page: selected.length,
        sourcePage: selected[selected.length - 1],
        total: selected.length
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
    index: number,
    sourcePage: number
  ) => Promise<Blob>,
  checkDeadline: () => void = () => {},
  onEncoding?: (page: number, total: number, sourcePage: number) => void,
  selection: PageSelection = ALL_PAGES
): Promise<File> {
  const deadline = performance.now() + PAGINATION_LIMITS.timeoutMs;
  const check = () => {
    checkAbort(signal);
    checkDeadline();
    if (performance.now() > deadline)
      throw Error('Pagination encoding timed out.');
  };
  // Check geometry without constructing artificial unbroken pages. The actual
  // full-plan slices below must satisfy their original pixel/source budgets.
  const expected = planPagination(
    {
      height: 1,
      extent: 1,
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
    plan.pages.length > PAGINATION_LIMITS.pages ||
    !Number.isInteger(plan.pages[plan.pages.length - 1]?.end) ||
    plan.pages[plan.pages.length - 1].end > PAGINATION_LIMITS.documentHeight
  )
    throw Error('Invalid pagination plan.');
  validateTableHeaders(
    plan.tables ?? [],
    plan.width,
    plan.pages[plan.pages.length - 1].end
  );
  let previous = 0,
    pixels = 0;
  for (const slice of plan.pages) {
    const continuing = plan.tables?.find(
      (t) =>
        slice.start >= Math.floor(t.headBottom) &&
        slice.start < t.rows[t.rows.length - 1].bottom - 0.5
    );
    if (
      continuing
        ? slice.header?.table !== continuing.index ||
          slice.header?.height !== continuing.height
        : !!slice.header
    )
      throw Error('Invalid repeated header page plan.');
    for (const table of plan.tables ?? []) {
      const protectedRows = [
        { top: table.top, bottom: table.rows[0].bottom },
        ...table.rows,
        { top: table.rows[table.rows.length - 1].top, bottom: table.bottom }
      ];
      if (
        protectedRows.some(
          (row) =>
            row.top < slice.end &&
            row.bottom > slice.end &&
            Math.min(slice.end - row.top, row.bottom - slice.end) > 0.5
        )
      )
        throw Error('Invalid repeated header row boundary.');
    }

    if (
      !Number.isInteger(slice.start) ||
      !Number.isInteger(slice.end) ||
      slice.start !== previous ||
      slice.end <= slice.start ||
      rasterHeight(slice) > plan.capacity ||
      !['end', 'boundary', 'capacity'].includes(slice.reason)
    )
      throw Error('Invalid pagination page bounds.');
    const count = image.width * rasterHeight(slice) * image.scale ** 2;
    pixels += count;
    if (
      count > PAGINATION_LIMITS.pagePixels ||
      pixels > PAGINATION_LIMITS.totalPixels
    )
      throw Error('Pagination raster budget exceeded.');
    previous = slice.end;
  }
  const selected = selectedSourcePages(selection, plan.pages.length);
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
  for (const [index, sourcePage] of selected.entries()) {
    const slice = plan.pages[sourcePage - 1];
    check();
    const blob = await capture(slice, index, sourcePage);
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
    const height = rasterHeight(slice);
    validateCapturedPng(bytes, { ...image, height });
    if (index) pdf.addPage(options.paper, options.orientation);
    onEncoding?.(index + 1, selected.length, sourcePage);
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
