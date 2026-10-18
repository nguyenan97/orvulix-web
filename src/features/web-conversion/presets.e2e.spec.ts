import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import Jimp from 'jimp';
import { PDFDocument } from 'pdf-lib';
import { placement } from './pdf-baseline/assertions';
async function apply(page: Page, label: string) {
  await page.getByLabel('Conversion preset', { exact: true }).click();
  await page.getByRole('option', { name: label, exact: true }).click();
}
async function download(page: Page) {
  const link = page.getByRole('link', { name: /^Download (PNG|JPEG|PDF)$/ });
  await expect(link).toBeVisible();
  const event = page.waitForEvent('download');
  await link.click();
  const file = await event;
  return {
    data: await readFile((await file.path())!),
    name: file.suggestedFilename()
  };
}
test('all image presets export real dimensions/colors, preserve HTML/filename and clear old output without auto conversion', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  const html =
    '<div style="width:100%;height:1000px;background-color:rgb(180,40,90)"><h1 style="margin:0">Nguyễn An</h1></div>';
  await page.getByLabel('HTML markup').fill(html);
  await page.getByLabel('Filename').fill('Preset Nguyễn');
  for (const [label, w, h, extension] of [
    ['Square PNG - 640 x 640', 640, 640, 'png'],
    ['Wide JPEG - 960 x 540', 960, 540, 'jpg'],
    ['Portrait PNG - 720 x 960', 720, 960, 'png']
  ] as const) {
    await apply(page, label);
    await expect(page.getByLabel('HTML markup')).toHaveValue(html);
    await expect(page.getByLabel('Filename')).toHaveValue('Preset Nguyễn');
    await expect(page.getByRole('link', { name: /^Download/ })).toHaveCount(0);
    await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
    await expect(page.getByLabel('Width (px)')).toHaveValue(String(w));
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(
      page
        .frameLocator('iframe[title="Sanitized HTML preview"]')
        .getByText('Nguyễn An')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Convert to image' }).click();
    const file = await download(page),
      image = await Jimp.read(file.data);
    expect([image.bitmap.width, image.bitmap.height]).toEqual([w, h]);
    expect(file.name).toBe(`Preset Nguyễn.${extension}`);
    const color = Jimp.intToRGBA(image.getPixelColor(w - 10, h - 10));
    [color.r, color.g, color.b].forEach((c, i) =>
      expect(Math.abs(c - [180, 40, 90][i])).toBeLessThanOrEqual(3)
    );
  }
});
test('PDF presets export real paper/orientation/margins and ordered source pixels; applying preset resets ranges/headers', async ({
  page
}) => {
  await page.goto('/pdf/html-to-pdf');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="height:400px;background-color:red">First</div><div style="height:400px;background-color:green">Second</div>'
    );
  await page.getByLabel('Filename').fill('PDF Nguyễn');
  await apply(page, 'A4 portrait - Paginated');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const a4 = await PDFDocument.load((await download(page)).data);
  expect(a4.getPageCount()).toBe(1);
  expect(a4.getPage(0).getWidth()).toBeCloseTo((210 * 72) / 25.4, 1);
  expect(a4.getPage(0).getHeight()).toBeCloseTo((297 * 72) / 25.4, 1);
  await page.getByLabel('Repeat table headers', { exact: true }).check();
  await page.getByLabel('Pages to export', { exact: true }).click();
  await page.getByRole('option', { name: 'Custom ranges' }).click();
  await page.getByLabel('Page ranges').fill('2');
  await apply(page, 'Letter landscape - Paginated');
  await expect(
    page.getByLabel('Repeat table headers', { exact: true })
  ).not.toBeChecked();
  await expect(
    page.getByLabel('Pages to export', { exact: true })
  ).toContainText('All pages');
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/2 pages - same/)).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const file = await download(page),
    pdf = await PDFDocument.load(file.data, { updateMetadata: false });
  expect(pdf.getPageCount()).toBe(2);
  expect(file.name).toBe('PDF Nguyễn.pdf');
  const points: number[][] = [];
  pdf.getPages().forEach((p, i) => {
    expect(p.getWidth()).toBeCloseTo(792, 1);
    expect(p.getHeight()).toBeCloseTo(612, 1);
    const [w, h, x, y] = placement(pdf, i);
    expect(x).toBeCloseTo((10 * 72) / 25.4, 6);
    expect(w / h).toBeCloseTo(640 / 400, 6);
    points.push([(x + w * 0.8) * 2, (p.getHeight() - y - h + h / 2) * 2]);
  });
  await page.goto('/pdf/pdf-to-png');
  await page.locator('input[type=file]').setInputFiles({
    name: 'presets.pdf',
    mimeType: 'application/pdf',
    buffer: file.data
  });
  await page.waitForFunction(
    () => !!document.querySelector('img[alt="Preview 0"]')
  );
  for (const [i, point] of points.entries()) {
    const image = page.locator(`img[alt="Preview ${i}"]`);
    await expect(image).toBeVisible();
    const rgba = await image.evaluate(async (el, point) => {
      const bitmap = await createImageBitmap(
        await (await fetch((el as HTMLImageElement).src)).blob()
      );
      const c = document.createElement('canvas');
      c.width = bitmap.width;
      c.height = bitmap.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const result = [
        ...ctx.getImageData(Math.floor(point[0]), Math.floor(point[1]), 1, 1)
          .data
      ];
      bitmap.close();
      c.width = c.height = 0;
      return result;
    }, point);
    expect(rgba).toEqual(i === 0 ? [255, 0, 0, 255] : [0, 128, 0, 255]);
  }
  await page.goto('/pdf/html-to-pdf');
  await apply(page, 'A4 portrait - One page');
  await page
    .getByLabel('HTML markup')
    .fill('<p style="background-color:red;height:200px">One page</p>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const one = await PDFDocument.load((await download(page)).data);
  expect(one.getPageCount()).toBe(1);
  expect(one.getPage(0).getWidth()).toBeCloseTo((210 * 72) / 25.4, 1);
});
test('applying presets during a held capture aborts late output; mobile/dark/keyboard and reset remain usable', async ({
  page
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/image-generic/html-to-image');
  await page
    .getByLabel('HTML markup')
    .fill('<div style="height:400px;background-color:red">Own HTML</div>');
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    Reflect.set(window, '__presetBlob', original);
    HTMLCanvasElement.prototype.toBlob = function (cb, type, q) {
      Reflect.set(window, '__presetCanvas', this);
      Reflect.set(window, '__presetRelease', () =>
        original.call(this, cb, type, q)
      );
    };
  });
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect
    .poll(() => page.evaluate(() => !!Reflect.get(window, '__presetCanvas')))
    .toBe(true);
  await apply(page, 'Square PNG - 640 x 640');
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Download/ })).toHaveCount(0);
  await page.evaluate(() => {
    Reflect.set(
      HTMLCanvasElement.prototype,
      'toBlob',
      Reflect.get(window, '__presetBlob')
    );
    Reflect.get(window, '__presetRelease')();
  });
  await expect
    .poll(() =>
      page.evaluate(() => Reflect.get(window, '__presetCanvas').width)
    )
    .toBe(0);
  await page.getByLabel('HTML markup').press('Control+Enter');
  const result = await Jimp.read((await download(page)).data);
  expect(result.bitmap.width).toBe(640);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(391);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('link', { name: /^Download/ })).toHaveCount(0);
  await expect(page.getByLabel('Width (px)')).toHaveValue('800');
});
