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
}
export interface PageSlice {
  start: number;
  end: number;
  reason: 'end' | 'boundary' | 'capacity';
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
}
/** Width-fit; integer CSS-pixel seams, independent of raster scale. */
export function planPagination(
  layout: DocumentLayout,
  image: ImageOptions,
  pdf: PdfOptions
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
  const pages: PageSlice[] = [];
  const end = Math.ceil(layout.height);
  let start = 0,
    pixels = 0;
  while (start < end) {
    let next = Math.min(start + capacity, end);
    const natural = next;
    // Retreat to the earliest crossing block until no protected range is cut.
    // Overlapping nested ranges converge or fail explicitly; never loop forever.
    for (let tries = 0; tries <= layout.blocks.length; tries++) {
      const crossing = layout.blocks.filter(
        (b) => b.top < next && b.bottom > next
      );
      if (!crossing.length) break;
      const previous = next;
      next = Math.floor(Math.min(...crossing.map((b) => b.top)));
      if (next <= start || next >= previous)
        throw Error(
          'Overlapping blocks cannot be paginated safely. Simplify the layout or use One page.'
        );
    }
    if (next <= start) throw Error('Pagination did not advance.');
    const pagePixels = image.width * (next - start) * image.scale ** 2;
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
      reason: next === end ? 'end' : next < natural ? 'boundary' : 'capacity'
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
    capacity
  };
}
