import { describe, expect, it, vi } from 'vitest';
import Jimp from 'jimp';
import { PDFArray, PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
import { planPagination } from './pagination';
import { assemblePaginatedPdf } from './paginated-renderer';
import { drawnImage, placement } from './pdf-baseline/assertions';
const image = { ...DEFAULT_OPTIONS, width: 320, filename: 'Nguyễn/An.pdf' };
const options = DEFAULT_PDF_OPTIONS;
async function png(height: number, color = 0xff000080, scale = 1) {
  const bytes = await new Jimp(
    image.width * scale,
    height * scale,
    color
  ).getBufferAsync(Jimp.MIME_PNG);
  return new Blob([new Uint8Array(bytes)], { type: 'image/png' });
}
describe('actual paginated PDF encoding', () => {
  it('checks cumulative encoded bytes before a third capture and elapsed time after deferred reads', async () => {
    const plan = planPagination(
      { height: 1200, extent: 1200, blocks: [] },
      image,
      options
    );
    let captures = 0;
    await expect(
      assemblePaginatedPdf(
        plan,
        image,
        options,
        new AbortController().signal,
        async (p) => {
          captures++;
          const blob = await png(p.end - p.start);
          Object.defineProperty(blob, 'size', { value: 5 * 1024 * 1024 });
          return blob;
        }
      )
    ).rejects.toThrow(/cumulative/);
    expect(captures).toBe(2);
    let clock = 0;
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => clock);
    try {
      await expect(
        assemblePaginatedPdf(
          plan,
          image,
          options,
          new AbortController().signal,
          async (p) => {
            const blob = await png(p.end - p.start),
              read = blob.arrayBuffer.bind(blob);
            blob.arrayBuffer = async () => {
              const bytes = await read();
              clock = 10001;
              return bytes;
            };
            return blob;
          }
        )
      ).rejects.toThrow(/timed out/);
    } finally {
      spy.mockRestore();
    }
  });

  for (const paper of ['a4', 'letter'] as const)
    for (const orientation of ['portrait', 'landscape'] as const)
      it(`${paper} ${orientation}: all page matrices, alpha, last-page aspect and safe resources`, async () => {
        const settings = {
          ...options,
          paper,
          orientation,
          margins: { top: 12, bottom: 30, left: 5, right: 20 }
        };
        const plan = planPagination(
          { height: 1200, extent: 1200, blocks: [] },
          image,
          settings
        );
        const colors: number[] = [];
        const file = await assemblePaginatedPdf(
          plan,
          image,
          settings,
          new AbortController().signal,
          async (p, i) => {
            colors.push(i);
            return png(p.end - p.start, i % 2 ? 0x00ff0080 : 0xff000080);
          }
        );
        const pdf = await PDFDocument.load(await file.arrayBuffer(), {
          updateMetadata: false
        });
        expect(file.name).toBe('Nguyễn-An.pdf');
        expect(pdf.getProducer()).toContain('jsPDF 4.2.1');
        expect(pdf.getPageCount()).toBe(plan.pages.length);
        expect(colors).toEqual(plan.pages.map((_, i) => i));
        for (const [i, p] of plan.pages.entries()) {
          const page = pdf.getPage(i),
            [w, h, x, y] = placement(pdf, i),
            obj = drawnImage(pdf, i);
          expect(page.getWidth()).toBeCloseTo((plan.pageWidth * 72) / 25.4, 1);
          expect(page.getHeight()).toBeCloseTo(
            (plan.pageHeight * 72) / 25.4,
            1
          );
          expect(x).toBeCloseTo((5 * 72) / 25.4, 6);
          expect(w / h).toBeCloseTo(image.width / (p.end - p.start), 6);
          expect(y).toBeCloseTo(
            page.getHeight() -
              ((12 + (p.end - p.start) * plan.mmPerCssPixel) * 72) / 25.4,
            1
          );
          expect(
            obj.dict.lookup(PDFName.of('Height'), PDFNumber).asNumber()
          ).toBe(p.end - p.start);
          expect(obj.dict.has(PDFName.of('SMask'))).toBe(true);
          expect(page.node.has(PDFName.of('Annots'))).toBe(false);
        }
        const action = pdf.catalog.lookup(PDFName.of('OpenAction'), PDFArray);
        expect(action.lookup(1, PDFName)).toEqual(PDFName.of('FitH'));
        expect(pdf.catalog.has(PDFName.of('Names'))).toBe(false);
      });
  it('cancels partial encoding, rejects late completion and recovers', async () => {
    const plan = planPagination(
      { height: 1000, extent: 1000, blocks: [] },
      image,
      options
    );
    const controller = new AbortController();
    let count = 0;
    await expect(
      assemblePaginatedPdf(
        plan,
        image,
        options,
        controller.signal,
        async (p) => {
          count++;
          controller.abort();
          return png(p.end - p.start);
        }
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(count).toBe(1);
    let calls = 0;
    await expect(
      assemblePaginatedPdf(
        plan,
        image,
        options,
        new AbortController().signal,
        (p) => png(p.end - p.start),
        () => {
          if (++calls === 5) throw Error('deadline');
        }
      )
    ).rejects.toThrow(/deadline/);
    expect(
      (
        await assemblePaginatedPdf(
          plan,
          image,
          options,
          new AbortController().signal,
          (p) => png(p.end - p.start)
        )
      ).size
    ).toBeGreaterThan(100);
  });
  it('rejects invalid plans, oversized bytes, mismatched PNG, encoder failure before further pages', async () => {
    const plan = planPagination(
      { height: 1000, extent: 1000, blocks: [] },
      image,
      options
    );
    const signal = new AbortController().signal;
    await expect(
      assemblePaginatedPdf({ ...plan, x: NaN }, image, options, signal, (p) =>
        png(p.end - p.start)
      )
    ).rejects.toThrow(/Invalid/);
    await expect(
      assemblePaginatedPdf(
        { ...plan, pages: [{ start: 1, end: 100, reason: 'end' }] },
        image,
        options,
        signal,
        (p) => png(p.end - p.start)
      )
    ).rejects.toThrow(/bounds/);
    await expect(
      assemblePaginatedPdf(plan, image, options, signal, () =>
        Promise.resolve(
          new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: 'image/png' })
        )
      )
    ).rejects.toThrow(/8 MiB/);
    await expect(
      assemblePaginatedPdf(plan, image, options, signal, () => png(1))
    ).rejects.toThrow(/dimensions/);
    await expect(
      assemblePaginatedPdf(plan, image, options, signal, () =>
        Promise.reject(Error('encoder failed'))
      )
    ).rejects.toThrow(/encoder failed/);
  });
});
