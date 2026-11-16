import { afterEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import Jimp from 'jimp';
import { buildPdf } from '../../../pages/tools/pdf/convert-to-pdf/service';
import { images, placement, drawnImage } from './assertions';

vi.mock('heic-to', () => ({ isHeic: vi.fn(async () => false) }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const options = {
  pageType: 'full',
  orientation: 'portrait',
  scale: 100
} as const;
async function source(
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  transparent = false
) {
  const image = new Jimp(width, height, transparent ? 0 : 0xff0000ff);
  if (transparent)
    image.setPixelColor(
      0xff0000ff,
      Math.floor(width / 2),
      Math.floor(height / 2)
    );
  const mime = format === 'png' ? Jimp.MIME_PNG : Jimp.MIME_JPEG;
  const bytes = await image.getBufferAsync(mime);
  return {
    file: new File([new Uint8Array(bytes)], `Nguyễn An.${format}`, {
      type: mime
    }),
    data: `data:${mime};base64,${bytes.toString('base64')}`,
    width,
    height
  };
}
function decoding(
  sources: Awaited<ReturnType<typeof source>>[],
  failures: string[] = []
) {
  let index = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(
    () => sources[index++].data
  );
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.stubGlobal(
    'Image',
    class {
      nodeType = 1;
      nodeName = 'IMG';
      src = '';
      width = 0;
      height = 0;
      hasAttribute(name: string) {
        return name === 'src';
      }
      getAttribute() {
        return this.src;
      }
      async decode() {
        if (failures.includes(this.src)) throw Error('Malformed image');
        const image = sources.find((item) => item.data === this.src)!;
        this.width = image.width;
        this.height = image.height;
      }
    }
  );
  return revoke;
}
describe('real jsPDF image consumer baseline', () => {
  it('keeps transparent PNG, full-size portrait dimensions and Unicode filename', async () => {
    const png = await source(40, 80, 'png', true);
    const revoke = decoding([png]);
    const { pdfFile, imageSizes } = await buildPdf([png.file], options);
    expect(pdfFile.name).toBe('Nguyễn An.pdf');
    expect(imageSizes[0]).toMatchObject({ widthPx: 40, heightPx: 80 });
    const pdf = await PDFDocument.load(await pdfFile.arrayBuffer(), {
      updateMetadata: false
    });
    expect(pdf.getProducer()).toBe('jsPDF 4.2.1');
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(30, 3);
    expect(pdf.getPage(0).getHeight()).toBeCloseTo(60, 3);
    expect(placement(pdf)[2]).toBe(0);
    expect(
      images(pdf).some((stream) => stream.dict.has(PDFName.of('SMask')))
    ).toBe(true);
    expect(revoke).toHaveBeenCalledWith(png.data);
  });
  it('preserves PNG/JPEG page order and each full-size orientation', async () => {
    const png = await source(40, 80, 'png'),
      jpeg = await source(80, 40, 'jpeg');
    decoding([png, jpeg]);
    const { pdfFile } = await buildPdf([png.file, jpeg.file], options);
    expect(pdfFile.name).toBe('merged-images.pdf');
    const pdf = await PDFDocument.load(await pdfFile.arrayBuffer(), {
      updateMetadata: false
    });
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPage(1).getWidth()).toBeCloseTo(60, 3);
    expect(pdf.getPage(1).getHeight()).toBeCloseTo(30, 3);
    expect(
      drawnImage(pdf, 0).dict.lookup(PDFName.of('Width'), PDFNumber).asNumber()
    ).toBe(40);
    expect(
      drawnImage(pdf, 1).dict.lookup(PDFName.of('Width'), PDFNumber).asNumber()
    ).toBe(80);
    expect(placement(pdf, 1)[2]).toBe(0);
  });
  it.each(['portrait', 'landscape'] as const)(
    'preserves A4 %s centered scale and margins',
    async (orientation) => {
      const png = await source(40, 80, 'png');
      decoding([png]);
      const { pdfFile } = await buildPdf([png.file], {
        pageType: 'a4',
        orientation,
        scale: 50
      });
      const pdf = await PDFDocument.load(await pdfFile.arrayBuffer(), {
        updateMetadata: false
      });
      const page = pdf.getPage(0);
      expect(page.getWidth()).toBeCloseTo(
        orientation === 'portrait' ? 595.28 : 841.89,
        1
      );
      const [width, height, x, y] = placement(pdf);
      expect(height).toBeCloseTo(page.getHeight() / 2, 3);
      expect(width).toBeCloseTo(height / 2, 3);
      expect(x).toBeCloseTo((page.getWidth() - width) / 2, 3);
      expect(y).toBeCloseTo((page.getHeight() - height) / 2, 3);
    }
  );
  it('rejects empty/all-invalid input, closes failed URLs and recovers', async () => {
    await expect(buildPdf([], options)).rejects.toThrow(/No files/);
    const png = await source(40, 80, 'png');
    const revoke = decoding([png, png], [png.data]);
    await expect(buildPdf([png.file], options)).rejects.toThrow(/No images/);
    expect(revoke).toHaveBeenCalledWith(png.data);
    decoding([png]);
    expect((await buildPdf([png.file], options)).pdfFile.size).toBeGreaterThan(
      100
    );
  });
  it('retains the jsPDF full-page ceiling of 14400 points without claiming an input quota', async () => {
    const png = await source(20000, 1, 'png');
    decoding([png]);
    const { pdfFile } = await buildPdf([png.file], options);
    const pdf = await PDFDocument.load(await pdfFile.arrayBuffer(), {
      updateMetadata: false
    });
    expect(pdf.getPage(0).getWidth()).toBe(14400);
    // jsPDF's mm -> points conversion introduces floating-point rounding.
    expect(placement(pdf)[0]).toBeCloseTo(14400, 8);
  });
  it('skips an invalid image while keeping valid output and releasing both URLs', async () => {
    const png = await source(40, 80, 'png'),
      jpeg = await source(80, 40, 'jpeg');
    const revoke = decoding([png, jpeg], [png.data]);
    const { pdfFile } = await buildPdf([png.file, jpeg.file], options);
    expect(
      (
        await PDFDocument.load(await pdfFile.arrayBuffer(), {
          updateMetadata: false
        })
      ).getPageCount()
    ).toBe(1);
    expect(revoke).toHaveBeenCalledWith(png.data);
    expect(revoke).toHaveBeenCalledWith(jpeg.data);
  });
});
