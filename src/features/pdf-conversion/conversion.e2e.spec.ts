import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import Jimp from 'jimp';
import { readFile } from 'node:fs/promises';

async function fixture(name = 'pages.pdf', huge = false) {
  const pdf = await PDFDocument.create();
  for (const color of [rgb(1, 0, 0), rgb(0, 0, 1)]) {
    const page = pdf.addPage([huge ? 3000 : 200, 100]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
      color
    });
    page.drawText('Literal & <text>', { x: 30, y: 50, size: 10 });
  }
  return {
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save())
  };
}
const picker = (page: Page) => page.locator('#tool input[type=file]');
const zipButton = (page: Page) =>
  page.getByRole('button', { name: 'Download All as ZIP', exact: true });

test('PNG ZIP retains two pages, dimensions and exact colors, then recovers from geometry rejection', async ({
  page
}) => {
  await page.goto('/pdf/pdf-to-png');
  await picker(page).setInputFiles(await fixture());
  await expect(zipButton(page)).toBeEnabled();
  const pending = page.waitForEvent('download');
  await zipButton(page).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('pages-pages.zip');
  const zip = await JSZip.loadAsync(await readFile((await download.path())!));
  expect(Object.keys(zip.files)).toEqual(['page-1.png', 'page-2.png']);
  for (const [index, name] of ['page-1.png', 'page-2.png'].entries()) {
    const image = await Jimp.read(await zip.file(name)!.async('nodebuffer'));
    expect([image.bitmap.width, image.bitmap.height]).toEqual([400, 200]);
    expect(Jimp.intToRGBA(image.getPixelColor(10, 10))).toEqual(
      index ? { r: 0, g: 0, b: 255, a: 255 } : { r: 255, g: 0, b: 0, a: 255 }
    );
  }
  await picker(page).setInputFiles(await fixture('huge.pdf', true));
  await expect(
    page.getByRole('alert', { name: 'PDF conversion error' })
  ).toContainText('pixel limit');
  await expect(zipButton(page)).toBeDisabled();
  await expect(page.locator('#tool img[alt^=Preview]')).toHaveCount(0);
  await picker(page).setInputFiles(await fixture('retry.pdf'));
  await expect(zipButton(page)).toBeEnabled();
  await expect(
    page.getByRole('alert', { name: 'PDF conversion error' })
  ).toHaveCount(0);
});

for (const kind of ['png', 'epub']) {
  test(`${kind} Clear, replacement and SPA unmount discard held conversion and recover`, async ({
    page
  }) => {
    await page.addInitScript(() => {
      const original = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = async function () {
        if (this.name === 'held.pdf') {
          document.documentElement.dataset.pdfHeld = String(
            Number(document.documentElement.dataset.pdfHeld || 0) + 1
          );
          await new Promise<void>((resolve) => {
            (window as Window & { releasePdf?: () => void }).releasePdf =
              resolve;
          });
          const bytes = await original.call(this);
          document.documentElement.dataset.pdfReleased = 'yes';
          return bytes;
        }
        return original.call(this);
      };
    });
    const route = `/pdf/pdf-to-${kind}`;
    const output =
      kind === 'png'
        ? zipButton(page)
        : page
            .locator('#tool')
            .getByRole('button', { name: 'Download', exact: true });
    await page.goto(route);
    await picker(page).setInputFiles(await fixture('held.pdf'));
    await page.waitForFunction(
      () => document.documentElement.dataset.pdfHeld === '1'
    );
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(output).toBeDisabled();
    await page.evaluate(
      () => (window as Window & { releasePdf?: () => void }).releasePdf?.()
    );
    await page.waitForFunction(
      () => document.documentElement.dataset.pdfReleased === 'yes'
    );
    await expect(output).toBeDisabled();
    await picker(page).setInputFiles({
      name: 'bad.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('invalid PDF')
    });
    await expect(
      page.getByRole('alert', { name: 'PDF conversion error' })
    ).toContainText('readable');
    await picker(page).setInputFiles(await fixture('valid.pdf'));
    await expect(output).toBeEnabled();
    await picker(page).setInputFiles(await fixture('held.pdf'));
    await page.waitForFunction(
      () => document.documentElement.dataset.pdfHeld === '2'
    );
    await expect(output).toBeDisabled();
    await picker(page).setInputFiles(await fixture('new.pdf'));
    await expect(output).toBeEnabled();
    await page.evaluate(
      () => (window as Window & { releasePdf?: () => void }).releasePdf?.()
    );
    await expect(output).toBeEnabled();
    await picker(page).setInputFiles(await fixture('held.pdf'));
    await page.waitForFunction(
      () => document.documentElement.dataset.pdfHeld === '3'
    );
    await expect(output).toBeDisabled();
    await page.evaluate(() => {
      history.pushState(null, '', '/');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.locator('#tool input[type=file]')).toHaveCount(0);
    await page.evaluate(
      () => (window as Window & { releasePdf?: () => void }).releasePdf?.()
    );
    await page.evaluate((route) => {
      history.pushState(null, '', route);
      dispatchEvent(new PopStateEvent('popstate'));
    }, route);
    await expect(output).toBeDisabled();
    await picker(page).setInputFiles(await fixture('retry.pdf'));
    await expect(output).toBeEnabled();
  });
}
