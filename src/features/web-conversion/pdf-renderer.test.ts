import { afterEach, describe, expect, it, vi } from 'vitest';
import Jimp from 'jimp';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import {
  assemblePdf,
  capturePdf,
  checkPdfOutput,
  validateCapturedPng
} from './pdf-renderer';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS, PDF_LIMITS } from './pdf-model';
import { prepareHtml } from './sanitize';
import { captureHtml } from './renderer';
import { drawnImage, placement } from './pdf-baseline/assertions';
vi.mock('./renderer', () => ({ captureHtml: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
const image = {
  ...DEFAULT_OPTIONS,
  width: 400,
  height: 200,
  filename: 'Nguyễn An.pdf'
};
async function png(scale = 1) {
  const source = new Jimp(400 * scale, 200 * scale, 0);
  source.setPixelColor(0xff0000ff, 50, 50);
  return new File(
    [new Uint8Array(await source.getBufferAsync(Jimp.MIME_PNG))],
    'capture.png',
    { type: 'image/png' }
  );
}
describe('real raster PDF assembly', () => {
  it.each([
    ['a4', 'portrait'],
    ['a4', 'landscape'],
    ['letter', 'portrait'],
    ['letter', 'landscape']
  ] as const)(
    'writes a single %s %s page with correct asymmetric fit and alpha',
    async (paper, orientation) => {
      const options = {
        paper,
        orientation,
        margins: { top: 12, right: 20, bottom: 30, left: 5 }
      };
      const file = await assemblePdf(
        await png(),
        image,
        options,
        new AbortController().signal
      );
      expect(file.type).toBe('application/pdf');
      expect(file.name).toBe('Nguyễn An.pdf');
      const bytes = await file.arrayBuffer();
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      expect(pdf.getProducer()).toBe('jsPDF 4.2.1');
      expect(pdf.getPageCount()).toBe(1);
      const page = pdf.getPage(0),
        factor = 72 / 25.4;
      const pageWidth =
        orientation === 'portrait'
          ? paper === 'a4'
            ? 210
            : 215.9
          : paper === 'a4'
            ? 297
            : 279.4;
      const pageHeight =
        orientation === 'portrait'
          ? paper === 'a4'
            ? 297
            : 279.4
          : paper === 'a4'
            ? 210
            : 215.9;
      expect(page.getWidth()).toBeCloseTo(pageWidth * factor, 1);
      expect(page.getHeight()).toBeCloseTo(pageHeight * factor, 1);
      const [width, height, x, y] = placement(pdf);
      expect(width / height).toBeCloseTo(2, 6);
      expect(x).toBeCloseTo(
        5 * factor + (pageWidth * factor - 25 * factor - width) / 2,
        1
      );
      expect(y).toBeCloseTo(
        30 * factor + (pageHeight * factor - 42 * factor - height) / 2,
        1
      );
      expect(drawnImage(pdf).dict.has(PDFName.of('SMask'))).toBe(true);
      expect(page.node.has(PDFName.of('Annots'))).toBe(false);
      // jsPDF's default OpenAction is a local page-view destination, not executable code.
      const destination = pdf.catalog.lookup(
        PDFName.of('OpenAction'),
        PDFArray
      );
      expect(destination.size()).toBe(3);
      expect(destination.get(0)).toEqual(page.ref);
      expect(destination.lookup(1, PDFName)).toEqual(PDFName.of('FitH'));
      expect(pdf.catalog.has(PDFName.of('AA'))).toBe(false);
      expect(pdf.catalog.has(PDFName.of('Names'))).toBe(false);
      expect(
        page.node.Resources()!.lookup(PDFName.of('Font'), PDFDict).keys()
      ).toHaveLength(0);
    }
  );
  it('scale doubles actual image pixels without changing PDF placement', async () => {
    const a = await PDFDocument.load(
      await (
        await assemblePdf(
          await png(),
          image,
          DEFAULT_PDF_OPTIONS,
          new AbortController().signal
        )
      ).arrayBuffer()
    );
    const b = await PDFDocument.load(
      await (
        await assemblePdf(
          await png(2),
          { ...image, scale: 2 },
          DEFAULT_PDF_OPTIONS,
          new AbortController().signal
        )
      ).arrayBuffer()
    );
    expect(placement(a)).toEqual(placement(b));
    expect(
      drawnImage(b).dict.lookup(PDFName.of('Width'), PDFNumber).asNumber()
    ).toBe(800);
    expect(
      drawnImage(b).dict.lookup(PDFName.of('Height'), PDFNumber).asNumber()
    ).toBe(400);
  });
  it('checks PNG signature, huge/mismatched headers, MIME and output byte ceilings', async () => {
    const file = await png(),
      bytes = new Uint8Array(await file.arrayBuffer());
    validateCapturedPng(bytes, image);
    expect(() => validateCapturedPng(new Uint8Array(33), image)).toThrow(
      /valid PNG/
    );
    new DataView(bytes.buffer).setUint32(16, 100000);
    expect(() => validateCapturedPng(bytes, image)).toThrow(/dimensions/);
    await expect(
      assemblePdf(
        new File(['bad'], 'x.jpg', { type: 'image/jpeg' }),
        image,
        DEFAULT_PDF_OPTIONS,
        new AbortController().signal
      )
    ).rejects.toThrow(/PNG/);
    expect(() =>
      checkPdfOutput(new Blob([], { type: 'application/pdf' }))
    ).toThrow(/encode/);
    expect(() =>
      checkPdfOutput(
        new Blob([new Uint8Array(PDF_LIMITS.outputBytes)], {
          type: 'application/pdf'
        })
      )
    ).not.toThrow();
    expect(() =>
      checkPdfOutput(
        new Blob([new Uint8Array(PDF_LIMITS.outputBytes + 1)], {
          type: 'application/pdf'
        })
      )
    ).toThrow(/8 MiB/);
    expect(() =>
      checkPdfOutput(new Blob(['bad'], { type: 'text/plain' }))
    ).toThrow(/encode/);
  });
  it.each(['cancel', 'timeout'] as const)(
    'discards delayed bytes after %s and removes deadline/listener',
    async (kind) => {
      const file = await png(),
        bytes = await file.arrayBuffer();
      vi.useFakeTimers();
      let finish!: (value: ArrayBuffer) => void;
      vi.spyOn(file, 'arrayBuffer').mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const controller = new AbortController(),
        remove = vi.spyOn(controller.signal, 'removeEventListener');
      const pending = assemblePdf(
        file,
        image,
        DEFAULT_PDF_OPTIONS,
        controller.signal
      );
      const assertion = expect(pending).rejects.toThrow(
        kind === 'cancel' ? /cancelled/ : /timed out/
      );
      if (kind === 'cancel') controller.abort();
      else await vi.advanceTimersByTimeAsync(PDF_LIMITS.timeoutMs);
      await assertion;
      finish(bytes);
      await vi.advanceTimersByTimeAsync(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    }
  );
  it('does not capture invalid runs and stops after an aborted capture', async () => {
    await expect(
      capturePdf(
        prepareHtml('<p>Safe</p>'),
        image,
        {
          ...DEFAULT_PDF_OPTIONS,
          paper: 'bad'
        } as unknown as typeof DEFAULT_PDF_OPTIONS,
        new AbortController().signal
      )
    ).rejects.toThrow(/options/);
    expect(captureHtml).not.toHaveBeenCalled();
    const controller = new AbortController();
    vi.mocked(captureHtml).mockImplementation(async () => {
      controller.abort();
      return png();
    });
    await expect(
      capturePdf(
        prepareHtml('<p>Safe</p>'),
        image,
        DEFAULT_PDF_OPTIONS,
        controller.signal
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('rejects elapsed work even before a delayed timer callback can fire', async () => {
    const file = await png(),
      bytes = await file.arrayBuffer();
    const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.spyOn(file, 'arrayBuffer').mockImplementation(async () => {
      clock.mockReturnValue(PDF_LIMITS.timeoutMs + 1);
      return bytes;
    });
    await expect(
      assemblePdf(
        file,
        image,
        DEFAULT_PDF_OPTIONS,
        new AbortController().signal
      )
    ).rejects.toThrow(/timed out/);
  });
});
