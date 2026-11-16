import { describe, expect, it, vi } from 'vitest';
import Jimp from 'jimp';
import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  decodePDFRawStream
} from 'pdf-lib';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
import { planPagination } from './pagination';
import { assemblePaginatedPdf } from './paginated-renderer';
import { drawnImage, placement } from './pdf-baseline/assertions';
import { ALL_PAGES, type PageSelection } from './page-ranges';
const image = { ...DEFAULT_OPTIONS, width: 320, filename: 'Nguyễn An.pdf' };
const options = DEFAULT_PDF_OPTIONS;
const layout = {
  height: 1200,
  extent: 1200,
  blocks: Array.from({ length: 4 }, (_, i) => ({
    top: i * 300,
    bottom: (i + 1) * 300,
    kind: 'block' as const
  }))
};
const plan = planPagination(layout, image, options);
const colors = [0xff000080, 0x00ff0080, 0x0000ff80, 0xffff0080];
async function capture(
  slice: { start: number; end: number },
  _index: number,
  sourcePage: number
) {
  const bytes = await new Jimp(
    320,
    slice.end - slice.start,
    colors[sourcePage - 1]
  ).getBufferAsync(Jimp.MIME_PNG);
  return new Blob([new Uint8Array(bytes)], { type: 'image/png' });
}
describe('selected pages in actual PDF bytes', () => {
  for (const expression of ['2', '1,3', '2-4', '4,2,2-3', '1-4'])
    it(`${expression}: selected captures only, exact geometry and original image order`, async () => {
      const called: number[] = [];
      const file = await assemblePaginatedPdf(
        plan,
        image,
        options,
        new AbortController().signal,
        async (s, i, p) => {
          called.push(p);
          return capture(s, i, p);
        },
        undefined,
        undefined,
        { mode: 'custom', expression }
      );
      const expected =
        expression === '2'
          ? [2]
          : expression === '1,3'
            ? [1, 3]
            : expression === '1-4'
              ? [1, 2, 3, 4]
              : [2, 3, 4];
      expect(called).toEqual(expected);
      expect(file.name).toBe('Nguyễn An.pdf');
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false
      });
      expect(pdf.getPageCount()).toBe(expected.length);
      const baseline = await PDFDocument.load(
        await (
          await assemblePaginatedPdf(
            plan,
            image,
            options,
            new AbortController().signal,
            capture
          )
        ).arrayBuffer()
      );
      for (const [i, source] of expected.entries()) {
        expect(placement(pdf, i)).toEqual(placement(baseline, source - 1));
        const object = drawnImage(pdf, i),
          original = drawnImage(baseline, source - 1);
        expect(
          object.dict.lookup(PDFName.of('Height'), PDFNumber).asNumber()
        ).toBe(300);
        expect(object.dict.has(PDFName.of('SMask'))).toBe(true);
        expect(
          Buffer.from(
            decodePDFRawStream(object as PDFRawStream).decode()
          ).equals(
            Buffer.from(decodePDFRawStream(original as PDFRawStream).decode())
          )
        ).toBe(true);
        expect(pdf.getPage(i).node.has(PDFName.of('Annots'))).toBe(false);
      }
      expect(pdf.catalog.has(PDFName.of('Names'))).toBe(false);
    });
  it('does not bypass full plan budgets for a one-page selection', async () => {
    const capture = vi.fn();
    const selection: PageSelection = { mode: 'custom', expression: '1' };
    const invalid = {
      ...plan,
      pages: [{ start: 0, end: 10001, reason: 'end' as const }]
    };
    await expect(
      assemblePaginatedPdf(
        invalid,
        image,
        options,
        new AbortController().signal,
        capture,
        undefined,
        undefined,
        selection
      )
    ).rejects.toThrow(/Invalid/);
    expect(capture).not.toHaveBeenCalled();
    await expect(
      assemblePaginatedPdf(
        plan,
        image,
        options,
        new AbortController().signal,
        capture,
        undefined,
        undefined,
        { mode: 'custom', expression: '5' }
      )
    ).rejects.toThrow(/outside/);
    expect(capture).not.toHaveBeenCalled();
  });
  it('validates total raster pixels of unselected pages before any capture', async () => {
    const large = { ...image, width: 1000, scale: 2 };
    const geometry = planPagination(
      { height: 1, extent: 1, blocks: [] },
      large,
      options
    );
    const pages = Array.from({ length: 6 }, (_, i) => ({
      start: i * 800,
      end: (i + 1) * 800,
      reason: 'boundary' as const
    }));
    const capture = vi.fn();
    await expect(
      assemblePaginatedPdf(
        { ...geometry, pages },
        large,
        options,
        new AbortController().signal,
        capture,
        undefined,
        undefined,
        { mode: 'custom', expression: '1' }
      )
    ).rejects.toThrow(/raster budget/);
    expect(capture).not.toHaveBeenCalled();
  });
  it('checks selected cumulative bytes, cancellation between selected pages and recovery', async () => {
    const controller = new AbortController();
    let count = 0;
    await expect(
      assemblePaginatedPdf(
        plan,
        image,
        options,
        controller.signal,
        async (s, i, p) => {
          count++;
          controller.abort();
          return capture(s, i, p);
        },
        undefined,
        undefined,
        { mode: 'custom', expression: '2-4' }
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(count).toBe(1);
    let encoded = 0;
    await expect(
      assemblePaginatedPdf(
        plan,
        image,
        options,
        new AbortController().signal,
        async (s, i, p) => {
          encoded++;
          const b = await capture(s, i, p);
          Object.defineProperty(b, 'size', { value: 5 * 1024 * 1024 });
          return b;
        },
        undefined,
        undefined,
        { mode: 'custom', expression: '1,3' }
      )
    ).rejects.toThrow(/cumulative/);
    expect(encoded).toBe(2);
    expect(
      (
        await assemblePaginatedPdf(
          plan,
          image,
          options,
          new AbortController().signal,
          capture,
          undefined,
          undefined,
          ALL_PAGES
        )
      ).size
    ).toBeGreaterThan(100);
  });
  it('accepts safe atomic breaks when an unbroken capacity page would exceed its raster budget', async () => {
    const large = { ...image, width: 1000, scale: 2 };
    const layout = {
      height: 2400,
      extent: 2400,
      blocks: [0, 800, 1600].map((top) => ({
        top,
        bottom: top + 800,
        kind: 'block' as const
      }))
    };
    const planned = planPagination(layout, large, options);
    expect(planned.pages).toHaveLength(3);
    // Reproduces the old assembler's incorrect validation using unbroken pages.
    expect(() =>
      planPagination({ ...layout, blocks: [] }, large, options)
    ).toThrow(/4 MP/);
    const capture = vi.fn(async () => {
      throw Error('capture reached');
    });
    await expect(
      assemblePaginatedPdf(
        planned,
        large,
        options,
        new AbortController().signal,
        capture
      )
    ).rejects.toThrow('capture reached');
    expect(capture).toHaveBeenCalledTimes(1);
  });
});
