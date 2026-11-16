import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import Jimp from 'jimp';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { RASTER_FIXTURES } from './assets.fixtures';
import { placement, drawnImage } from './pdf-baseline/assertions';
const redHtml =
  '<div style="height:100px;background-color:red">Recovered document</div>';
async function input(page: Page, pdf: boolean, html = redHtml) {
  await page.goto(pdf ? '/pdf/html-to-pdf' : '/image-generic/html-to-image');
  await page.getByLabel('Width (px)').fill('400');
  await page.getByLabel('Height (px)').fill('200');
  await page.getByLabel('Filename').fill('Deadline Nguyễn');
  await page.getByLabel('HTML markup').fill(html);
}
async function result(page: Page, pdf: boolean) {
  const link = page.getByRole('link', {
    name: pdf ? 'Download PDF' : /^Download (PNG|JPEG)$/
  });
  await expect(link).toBeVisible();
  const event = page.waitForEvent('download');
  await link.click();
  const file = await event;
  return {
    name: file.suggestedFilename(),
    bytes: await readFile((await file.path())!)
  };
}
async function pdfPixels(page: Page, bytes: Buffer, point: number[]) {
  await page.goto('/pdf/pdf-to-png');
  await page.locator('input[type=file]').setInputFiles({
    name: 'deadline.pdf',
    mimeType: 'application/pdf',
    buffer: bytes
  });
  await page.waitForFunction(
    () => !!document.querySelector('img[alt="Preview 0"]')
  );
  const image = page.locator('img[alt="Preview 0"]');
  await expect(image).toBeVisible();
  return image.evaluate(async (el, [x, y]) => {
    const bitmap = await createImageBitmap(
      await (await fetch((el as HTMLImageElement).src)).blob()
    );
    const c = document.createElement('canvas');
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const color = [
      ...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
    ];
    bitmap.close();
    c.width = c.height = 0;
    return color;
  }, point);
}
for (const format of ['PNG', 'JPEG', 'PDF'] as const) {
  test(`${format}: elapsed capture completion rejects before timer delivery, cleans real canvas and downloads valid recovery`, async ({
    page
  }) => {
    const pdf = format === 'PDF';
    await input(page, pdf);
    if (format === 'PNG')
      await expect(
        page.getByText(
          'This tool exports PNG and JPEG only. Use the separate HTML to PDF tool for local raster PDF output; its text is not searchable or selectable.',
          { exact: true }
        )
      ).toBeVisible();
    if (format === 'JPEG') {
      await page.getByLabel('Format', { exact: true }).click();
      await page.getByRole('option', { name: 'JPEG', exact: true }).click();
    }
    await page.evaluate(() => {
      Reflect.set(window, '__clock', performance.now.bind(performance));
      const native = HTMLCanvasElement.prototype.toBlob;
      Reflect.set(window, '__nativeBlob', native);
      HTMLCanvasElement.prototype.toBlob = function (cb, type, quality) {
        Reflect.set(window, '__ownedCanvas', this);
        Reflect.set(window, '__releaseBlob', () =>
          native.call(this, cb, type, quality)
        );
      };
    });
    await page
      .getByRole('button', {
        name: pdf ? 'Convert to PDF' : 'Convert to image'
      })
      .click();
    await expect
      .poll(() => page.evaluate(() => !!Reflect.get(window, '__releaseBlob')))
      .toBe(true);
    await page.evaluate(() => {
      // Timer time stays unchanged. Native encoding still produces actual bytes.
      Reflect.set(
        performance,
        'now',
        () => Reflect.get(window, '__clock')() + 10001
      );
      Reflect.get(window, '__releaseBlob')();
    });
    await expect(
      page.getByText('Rendering took too long. Simplify your HTML.', {
        exact: true
      })
    ).toBeVisible();
    await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Download/ })).toHaveCount(0);
    await expect(
      page.getByRole('img', { name: 'Converted HTML image' })
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => Reflect.get(window, '__ownedCanvas').width)
      )
      .toBe(0);
    await page.evaluate(() => {
      Reflect.set(performance, 'now', Reflect.get(window, '__clock'));
      Reflect.set(
        HTMLCanvasElement.prototype,
        'toBlob',
        Reflect.get(window, '__nativeBlob')
      );
    });
    await page
      .getByRole('button', {
        name: pdf ? 'Convert to PDF' : 'Convert to image'
      })
      .click();
    const file = await result(page, pdf);
    if (!pdf) {
      const image = await Jimp.read(file.bytes);
      expect([image.bitmap.width, image.bitmap.height]).toEqual([400, 200]);
      expect(file.name).toBe(
        `Deadline Nguyễn.${format === 'JPEG' ? 'jpg' : 'png'}`
      );
      const color = Jimp.intToRGBA(image.getPixelColor(300, 50));
      [color.r, color.g, color.b].forEach((c, i) =>
        expect(Math.abs(c - [255, 0, 0][i])).toBeLessThanOrEqual(3)
      );
    } else {
      const doc = await PDFDocument.load(file.bytes, { updateMetadata: false });
      expect(doc.getPageCount()).toBe(1);
      expect(doc.getPage(0).getWidth()).toBeCloseTo((210 * 72) / 25.4, 1);
      expect(
        drawnImage(doc).dict.lookup(PDFName.of('Width'), PDFNumber).asNumber()
      ).toBe(400);
      const [w, h, x, y] = placement(doc),
        ph = doc.getPage(0).getHeight();
      expect(w / h).toBeCloseTo(2, 6);
      expect(
        await pdfPixels(page, file.bytes, [
          (x + w * 0.75) * 2,
          (ph - y - h + h * 0.25) * 2
        ])
      ).toEqual([255, 0, 0, 255]);
    }
  });
}
for (const flow of ['Preview', 'One page', 'Paginated'] as const) {
  test(`${flow}: elapsed native asset validation closes bitmap, prevents late preview/export and recovers`, async ({
    page
  }) => {
    const pdf = flow !== 'Preview';
    const source =
      flow === 'One page' ? RASTER_FIXTURES.jpeg : RASTER_FIXTURES.png;
    await input(
      page,
      pdf,
      `<div style="height:100px;background-color:red"><img src="${source}">Asset document</div>`
    );
    if (flow === 'Paginated') {
      await page.getByLabel('PDF layout', { exact: true }).click();
      await page
        .getByRole('option', { name: 'Paginated', exact: true })
        .click();
    }
    await page.evaluate(() => {
      const native = createImageBitmap.bind(window);
      Reflect.set(window, '__nativeBitmap', native);
      Reflect.set(window, '__clock', performance.now.bind(performance));
      Reflect.set(window, 'createImageBitmap', async (blob: Blob) => {
        const bitmap = await native(blob);
        Reflect.set(window, '__ownedBitmap', bitmap);
        await new Promise<void>((resolve) =>
          Reflect.set(window, '__releaseBitmap', resolve)
        );
        return bitmap;
      });
    });
    await page
      .getByRole('button', {
        name: pdf ? 'Convert to PDF' : 'Preview',
        exact: true
      })
      .click();
    await expect
      .poll(() => page.evaluate(() => !!Reflect.get(window, '__releaseBitmap')))
      .toBe(true);
    await page.evaluate(() => {
      Reflect.set(
        performance,
        'now',
        () => Reflect.get(window, '__clock')() + 5001
      );
      Reflect.get(window, '__releaseBitmap')();
    });
    await expect(
      page.getByText('Embedded image decoding timed out. Use smaller images.', {
        exact: true
      })
    ).toBeVisible();
    await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
    await expect(
      page.locator(
        'iframe[title="Sanitized HTML preview"],iframe[title^="Paginated preview"]'
      )
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Download/ })).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => Reflect.get(window, '__ownedBitmap').width)
      )
      .toBe(0);
    await page.evaluate(() => {
      Reflect.set(performance, 'now', Reflect.get(window, '__clock'));
      Reflect.set(
        window,
        'createImageBitmap',
        Reflect.get(window, '__nativeBitmap')
      );
    });
    await page
      .getByRole('button', {
        name: pdf ? 'Convert to PDF' : 'Preview',
        exact: true
      })
      .click();
    if (!pdf) {
      const image = page
        .frameLocator('iframe[title="Sanitized HTML preview"]')
        .locator('img');
      await expect(image).toBeVisible();
      const actual = await image.evaluate(async (el) => {
        const img = el as HTMLImageElement;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const color = [...ctx.getImageData(8, 8, 1, 1).data];
        c.width = c.height = 0;
        return { width: img.naturalWidth, height: img.naturalHeight, color };
      });
      expect(actual).toEqual({
        width: 16,
        height: 16,
        color: [255, 0, 0, 255]
      });
    } else {
      const file = await result(page, true),
        doc = await PDFDocument.load(file.bytes, { updateMetadata: false });
      expect(doc.getPageCount()).toBe(1);
      const [w, h, x, y] = placement(doc),
        ph = doc.getPage(0).getHeight();
      const pixels = await pdfPixels(page, file.bytes, [
        (x + w * 0.75) * 2,
        (ph - y - h + h * (flow === 'Paginated' ? 0.5 : 0.25)) * 2
      ]);
      expect(pixels).toEqual([255, 0, 0, 255]);
    }
  });
}
