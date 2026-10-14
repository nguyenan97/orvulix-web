import {
  rasterHeight,
  validateTableHeaders,
  type TableHeader,
  type RepeatedHeader
} from './table-header-model';
import { pdfGeometry, type PdfOptions } from './pdf-model';
import { type ImageOptions } from './model';

export const PAGINATION_LIMITS = {
  pages: 8,
  documentHeight: 10_000,
  pagePixels: 4_000_000,
  totalPixels: 16_000_000,
  timeoutMs: 10_000
} as const;
export interface ProtectedBlock {
  top: number;
  bottom: number;
  kind: 'block' | 'row';
}
export interface DocumentLayout {
  height: number;
  extent: number;
  blocks: ProtectedBlock[];
  tables?: TableHeader[];
}
export interface PageSlice {
  start: number;
  end: number;
  reason: 'end' | 'boundary' | 'capacity';
  header?: RepeatedHeader;
}
export interface PaginationPlan {
  pages: PageSlice[];
  width: number;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  mmPerCssPixel: number;
  x: number;
  y: number;
  capacity: number;
  tables?: TableHeader[];
}
/** Width-fit; integer CSS-pixel seams, independent of raster scale. */
export function planPagination(
  layout: DocumentLayout,
  image: ImageOptions,
  pdf: PdfOptions,
  repeatHeaders = false
): PaginationPlan {
  // Viewport height is irrelevant to paginated output. Validate the remaining
  // legacy contract through a small bounded viewport without its pixel budget.
  const geometry = pdfGeometry(pdf, { ...image, height: 100 });
  const ratio = geometry.printableWidth / image.width;
  const capacity = Math.floor(geometry.printableHeight / ratio);
  if (!Number.isFinite(capacity) || capacity < 1)
    throw Error('Margins must leave at least one CSS pixel of page height.');
  if (
    !Number.isFinite(layout.height) ||
    !Number.isFinite(layout.extent) ||
    layout.height < 0 ||
    layout.extent < layout.height ||
    layout.extent > PAGINATION_LIMITS.documentHeight
  )
    throw Error('Document geometry exceeds the 10000 CSS pixel limit.');
  if (layout.blocks.length > 1000) throw Error('Too many measured blocks.');
  for (const block of layout.blocks) {
    if (
      !['block', 'row'].includes(block.kind) ||
      !Number.isFinite(block.top) ||
      !Number.isFinite(block.bottom) ||
      block.top < 0 ||
      block.bottom < block.top ||
      block.bottom > layout.height
    )
      throw Error('Invalid measured block coordinates.');
    if (Math.ceil(block.bottom) - Math.floor(block.top) > capacity)
      throw Error(
        `A ${block.kind} is taller than one printable page. Shorten it, increase printable height or use One page.`
      );
  }
  const tables = repeatHeaders ? layout.tables ?? [] : [];
  validateTableHeaders(tables, image.width, layout.height);
  const blocks = [...layout.blocks];
  for (const table of tables) {
    blocks.push(...table.rows);
    for (const row of table.rows) {
      if (
        table.height + Math.ceil(row.bottom) - Math.floor(row.top) + 1 >
        capacity
      )
        throw Error(
          'Repeated header and a body row must fit one printable page. Reduce header/row height or turn Repeat table headers off.'
        );
    }
    // Original header must stay with its first row; keep the final outer border.
    blocks.push({ top: table.top, bottom: table.rows[0].bottom, kind: 'row' });
    blocks.push({
      top: table.rows[table.rows.length - 1].top,
      bottom: table.bottom,
      kind: 'row'
    });
  }
  const pages: PageSlice[] = [];
  const end = Math.ceil(layout.height);
  let start = 0,
    pixels = 0;
  while (start < end) {
    const continuing = tables.find(
      (t) =>
        start >= Math.floor(t.headBottom) &&
        start < t.rows[t.rows.length - 1].bottom - 0.5
    );
    const header = continuing
      ? { table: continuing.index, height: continuing.height }
      : undefined;
    let next = Math.min(start + capacity - (header?.height ?? 0), end);
    const natural = next;
    // Retreat to the earliest crossing block until no protected range is cut.
    // Overlapping nested ranges converge or fail explicitly; never loop forever.
    for (let tries = 0; tries <= blocks.length; tries++) {
      const crossing = blocks.filter((b) => b.top < next && b.bottom > next);
      if (!crossing.length) break;
      // Native collapsed borders place adjacent row edges on half pixels.
      // Allow only that rounding band, never a cut through a real block/row.
      if (
        crossing.every(
          (b) =>
            b.kind === 'row' && Math.min(next - b.top, b.bottom - next) <= 0.5
        )
      )
        break;
      const previous = next;
      next = Math.floor(Math.min(...crossing.map((b) => b.top)));
      if (next <= start || next >= previous)
        throw Error(
          'Overlapping blocks cannot be paginated safely. Simplify the layout or use One page.'
        );
    }
    if (next <= start) throw Error('Pagination did not advance.');
    const pagePixels =
      image.width *
      rasterHeight({ start, end: next, header }) *
      image.scale ** 2;
    pixels += pagePixels;
    if (
      pagePixels > PAGINATION_LIMITS.pagePixels ||
      pixels > PAGINATION_LIMITS.totalPixels
    )
      throw Error(
        'Pagination exceeds 4 MP per page or 16 MP total. Reduce width or scale.'
      );
    if (pages.length === PAGINATION_LIMITS.pages)
      throw Error(
        'Document exceeds 8 PDF pages. Shorten content or increase printable height.'
      );
    pages.push({
      start,
      end: next,
      reason: next === end ? 'end' : next < natural ? 'boundary' : 'capacity',
      ...(header ? { header } : {})
    });
    start = next;
  }
  if (!pages.length) throw Error('No visible content remains for pagination.');
  return {
    pages,
    width: image.width,
    scale: image.scale,
    pageWidth: geometry.pageWidth,
    pageHeight: geometry.pageHeight,
    mmPerCssPixel: ratio,
    x: pdf.margins.left,
    y: pdf.margins.top,
    capacity,
    ...(tables.length ? { tables } : {})
  };
}
