import { expect, it, vi } from 'vitest';
import Jimp from 'jimp';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
import { planPagination } from './pagination';
import { rasterHeight, type TableHeader } from './table-header-model';
import { assemblePaginatedPdf } from './paginated-renderer';
import { drawnImage, placement } from './pdf-baseline/assertions';
const image = { ...DEFAULT_OPTIONS, width: 320, filename: 'Hóa đơn/2026' };
const table: TableHeader = {
  index: 0,
  top: 0,
  bottom: 1500,
  headBottom: 60,
  left: 0,
  width: 320,
  height: 60,
  columns: [160, 160],
  rows: Array.from({ length: 24 }, (_, i) => ({
    top: 60 + i * 60,
    bottom: 120 + i * 60,
    kind: 'row'
  }))
};
const plan = () =>
  planPagination(
    { height: 1500, extent: 1500, blocks: table.rows, tables: [table] },
    image,
    DEFAULT_PDF_OPTIONS,
    true
  );
it('encodes selected continuation pages with header dimensions, alpha, correct placement and no active content', async () => {
  const p = plan(),
    visited: number[] = [];
  const file = await assemblePaginatedPdf(
    p,
    image,
    DEFAULT_PDF_OPTIONS,
    new AbortController().signal,
    async (slice, _i, source) => {
      visited.push(source);
      const raster = new Jimp(320, rasterHeight(slice), 0x00ff0080);
      if (slice.header)
        raster.composite(new Jimp(320, slice.header.height, 0xff0000ff), 0, 0);
      return new Blob(
        [new Uint8Array(await raster.getBufferAsync(Jimp.MIME_PNG))],
        { type: 'image/png' }
      );
    },
    undefined,
    undefined,
    { mode: 'custom', expression: '4,2,2' }
  );
  const pdf = await PDFDocument.load(await file.arrayBuffer(), {
    updateMetadata: false
  });
  expect(visited).toEqual([2, 4]);
  expect(pdf.getPageCount()).toBe(2);
  expect(file.name).toBe('Hóa đơn-2026.pdf');
  for (const [i, n] of visited.entries()) {
    const h = rasterHeight(p.pages[n - 1]),
      obj = drawnImage(pdf, i),
      [w, ph] = placement(pdf, i);
    expect(obj.dict.lookup(PDFName.of('Height'), PDFNumber).asNumber()).toBe(h);
    expect(w / ph).toBeCloseTo(320 / h, 6);
    expect(obj.dict.has(PDFName.of('SMask'))).toBe(true);
    expect(pdf.getPage(i).node.has(PDFName.of('Annots'))).toBe(false);
  }
  expect(pdf.catalog.has(PDFName.of('Names'))).toBe(false);
  expect(pdf.catalog.has(PDFName.of('AA'))).toBe(false);
});
it('rejects forged/missing headers before capture even when only one output page is selected', async () => {
  for (const mutate of [
    (p: ReturnType<typeof plan>) => {
      p.pages[1].header!.height = NaN;
    },
    (p: ReturnType<typeof plan>) => {
      delete p.pages[1].header;
    },
    (p: ReturnType<typeof plan>) => {
      p.pages[0].header = { table: 0, height: 60 };
    }
  ]) {
    const p = plan();
    mutate(p);
    const capture = vi.fn();
    await expect(
      assemblePaginatedPdf(
        p,
        image,
        DEFAULT_PDF_OPTIONS,
        new AbortController().signal,
        capture,
        undefined,
        undefined,
        { mode: 'custom', expression: '1' }
      )
    ).rejects.toThrow(/header/);
    expect(capture).not.toHaveBeenCalled();
  }
});

it('rejects a forged seam through a body row even when source slices remain contiguous', async () => {
  const p = plan();
  p.pages[0].end -= 20;
  p.pages[1].start -= 20;
  const capture = vi.fn();
  await expect(
    assemblePaginatedPdf(
      p,
      image,
      DEFAULT_PDF_OPTIONS,
      new AbortController().signal,
      capture
    )
  ).rejects.toThrow(/row boundary/);
  expect(capture).not.toHaveBeenCalled();
});

it('full-plan repeated pixels cannot be bypassed by selecting only source page 1', async () => {
  const t = {
    ...table,
    width: 800,
    columns: [200, 600],
    height: 200,
    headBottom: 200,
    bottom: 5000,
    rows: Array.from({ length: 80 }, (_, i) => ({
      top: 200 + i * 60,
      bottom: 260 + i * 60,
      kind: 'row' as const
    }))
  };
  const raster = { ...image, width: 800, scale: 2 },
    source = { height: 5000, extent: 5000, blocks: t.rows, tables: [t] };
  const p = {
    ...planPagination(
      source,
      { ...raster, scale: 1 },
      DEFAULT_PDF_OPTIONS,
      true
    ),
    scale: 2
  };
  const capture = vi.fn();
  await expect(
    assemblePaginatedPdf(
      p,
      raster,
      DEFAULT_PDF_OPTIONS,
      new AbortController().signal,
      capture,
      undefined,
      undefined,
      { mode: 'custom', expression: '1' }
    )
  ).rejects.toThrow(/raster budget/);
  expect(capture).not.toHaveBeenCalled();
});
