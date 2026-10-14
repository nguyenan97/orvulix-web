import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import Jimp from 'jimp';
import { PDFDocument, PDFName } from 'pdf-lib';
import { drawnImage, placement } from './assertions';

async function raster(
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  transparent = false
) {
  const image = new Jimp(width, height, transparent ? 0 : 0xff0000ff);
  if (transparent)
    for (let y = height / 4; y < (height * 3) / 4; y++)
      for (let x = width / 4; x < (width * 3) / 4; x++)
        image.setPixelColor(0xff0000ff, x, y);
  const mimeType = format === 'png' ? Jimp.MIME_PNG : Jimp.MIME_JPEG;
  return {
    name: `Nguyễn An.${format}`,
    mimeType,
    buffer: await image.getBufferAsync(mimeType)
  };
}
async function downloadPdf(page: Page) {
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeEnabled();
  // Native PDF iframe viewers can emit their own downloads; select the explicit tool file.
  const images = page.url().endsWith('/pdf/convert-to-pdf');
  const pending = page.waitForEvent('download', {
    predicate: (download) =>
      images
        ? download.suggestedFilename() === 'merged-images.pdf'
        : /^Nguyễn An-\d+\.pdf$/.test(download.suggestedFilename())
  });
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const download = await pending;
  return {
    name: download.suggestedFilename(),
    bytes: await readFile((await download.path())!)
  };
}
async function renderPdf(page: Page, bytes: Buffer, count: number) {
  // A real second tool flow runs installed PDF.js and its emitted worker.
  await page.goto('/pdf/pdf-to-png');
  await page.locator('input[type=file]').setInputFiles({
    name: 'result.pdf',
    mimeType: 'application/pdf',
    buffer: bytes
  });
  // Wait for the real completed export control before asserting page count.
  await page
    .getByRole('button', { name: 'Download All as ZIP', exact: true })
    .waitFor({ state: 'visible' });
  const previews = page.locator('img[alt^="Preview "]');
  await expect(previews).toHaveCount(count);
  const result: {
    width: number;
    height: number;
    center: number[];
    corner: number[];
  }[] = [];
  for (let index = 0; index < count; index++) {
    result.push(
      await previews.nth(index).evaluate(async (image) => {
        const blob = await (
          await fetch((image as HTMLImageElement).src)
        ).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0);
        const center = [
          ...context.getImageData(
            Math.floor(bitmap.width / 2),
            Math.floor(bitmap.height / 2),
            1,
            1
          ).data
        ];
        const corner = [...context.getImageData(0, 0, 1, 1).data];
        bitmap.close();
        return { width: canvas.width, height: canvas.height, center, corner };
      })
    );
  }
  return result;
}
function red(pixel: number[]) {
  expect(pixel[0]).toBeGreaterThan(240);
  expect(pixel[1]).toBeLessThan(15);
  expect(pixel[2]).toBeLessThan(15);
  expect(pixel[3]).toBe(255);
}
test('full-size mixed PNG/JPEG preserves portrait/landscape pages, alpha and real nonblank PDF rendering', async ({
  page
}) => {
  await page.goto('/pdf/convert-to-pdf');
  await page
    .locator('input[type=file]')
    .setInputFiles([
      await raster(80, 160, 'png', true),
      await raster(160, 80, 'jpeg')
    ]);
  const { name, bytes } = await downloadPdf(page);
  expect(name).toBe('merged-images.pdf');
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(2);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(60, 3);
  expect(pdf.getPage(0).getHeight()).toBeCloseTo(120, 3);
  expect(pdf.getPage(1).getWidth()).toBeCloseTo(120, 3);
  expect(pdf.getPage(1).getHeight()).toBeCloseTo(60, 3);
  expect(drawnImage(pdf).dict.has(PDFName.of('SMask'))).toBe(true);
  expect(placement(pdf)[2]).toBe(0);
  const output = await renderPdf(page, bytes, 2);
  output.forEach((image) => red(image.center));
  expect(output[0].corner).toEqual([255, 255, 255, 255]);
  red(output[1].corner);
});
for (const [orientation, scale] of [
  ['portrait', 10],
  ['landscape', 100]
] as const) {
  test(`A4 ${orientation} scale ${scale} preserves page size, centered margins and Unicode download`, async ({
    page
  }) => {
    await page.goto('/pdf/convert-to-pdf');
    await page.getByRole('radio', { name: 'A4 Page', exact: true }).check();
    await page
      .getByRole('radio', {
        name:
          orientation === 'portrait'
            ? 'Portrait (Vertical)'
            : 'Landscape (Horizontal)',
        exact: true
      })
      .check();
    await page.getByRole('slider').press(scale === 10 ? 'Home' : 'End');
    await page
      .locator('input[type=file]')
      .setInputFiles(await raster(160, 80, 'jpeg'));
    const { name, bytes } = await downloadPdf(page);
    expect(name).toBe('Nguyễn An.pdf');
    const pdf = await PDFDocument.load(bytes),
      pageSize = pdf.getPage(0).getSize();
    expect(pdf.getPageCount()).toBe(1);
    expect(pageSize.width).toBeCloseTo(
      orientation === 'portrait' ? 595.28 : 841.89,
      1
    );
    expect(pageSize.height).toBeCloseTo(
      orientation === 'portrait' ? 841.89 : 595.28,
      1
    );
    const [width, height, x, y] = placement(pdf);
    expect(width).toBeCloseTo((pageSize.width * scale) / 100, 2);
    expect(height).toBeCloseTo(width / 2, 2);
    expect(x).toBeCloseTo((pageSize.width - width) / 2, 2);
    expect(y).toBeCloseTo((pageSize.height - height) / 2, 2);
    const output = await renderPdf(page, bytes, 1);
    red(output[0].center);
    expect(output[0].corner).toEqual([255, 255, 255, 255]);
  });
}
test('invalid decode has an actionable error, no unhandled rejection and valid upload recovers', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/pdf/convert-to-pdf');
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.png',
    mimeType: 'image/png',
    buffer: Buffer.from('invalid raster')
  });
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Image cannot be decoded. Choose a supported image.' })
  ).toBeVisible();
  // Import preflight rejects the entire invalid batch before conversion starts.
  await expect(
    page.getByRole('button', { name: 'Delete file', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles(await raster(80, 160, 'png'));
  const result = await downloadPdf(page);
  expect((await PDFDocument.load(result.bytes)).getPageCount()).toBe(1);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test('split image to pages stays on pdf-lib and preserves four tiles, padding and edge whitespace', async ({
  page
}) => {
  await page.goto('/image-generic/split-to-pages');
  await page
    .locator('input[type=file]')
    .setInputFiles(await raster(800, 1200, 'png'));
  const { name, bytes } = await downloadPdf(page);
  expect(name).toMatch(/^Nguyễn An-\d+\.pdf$/);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(4);
  for (let index = 0; index < 4; index++) {
    expect(pdf.getPage(index).getWidth()).toBeCloseTo(595.28, 1);
    const [width, height, x, y] = placement(pdf, index);
    expect(x).toBeCloseTo((5 * 72) / 25.4, 2);
    expect(y).toBeCloseTo(x, 2);
    expect(width).toBeCloseTo(pdf.getPage(index).getWidth() - 2 * x, 2);
    expect(height).toBeCloseTo(pdf.getPage(index).getHeight() - 2 * y, 2);
  }
  const output = await renderPdf(page, bytes, 4);
  output.forEach((image) => expect(image.corner).toEqual([255, 255, 255, 255]));
  red(output[0].center);
  expect(output[3].center).toEqual([255, 255, 255, 255]);
});
