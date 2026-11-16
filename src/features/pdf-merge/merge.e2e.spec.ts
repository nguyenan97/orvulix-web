import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, rgb } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
const prefix = process.env.MERGE_TEST_PREFIX ?? '';
const route = (path: string) => `${prefix}${path}`;
const downloadButton = (page: Page) =>
  page.getByRole('button', { name: 'Download', exact: true });
async function fixture(
  name = 'Việt Nam.pdf',
  sizes = [
    [120, 210],
    [310, 160]
  ]
) {
  const pdf = await PDFDocument.create();
  sizes.forEach(([width, height], i) => {
    const page = pdf.addPage([width, height]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: i ? rgb(0, 0, 1) : rgb(1, 0, 0)
    });
  });
  return {
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save())
  };
}
async function download(page: Page) {
  await expect(downloadButton(page)).toBeEnabled();
  const event = page.waitForEvent('download', {
    predicate: (file) => file.suggestedFilename() === 'merged.pdf'
  });
  await downloadButton(page).click();
  return readFile((await (await event).path())!);
}
async function gate(page: Page, corrupt = false) {
  await page.addInitScript(
    ({ corrupt }) => {
      const original = File.prototype.arrayBuffer;
      const calls = new WeakMap<File, number>();
      File.prototype.arrayBuffer = async function () {
        const count = (calls.get(this) ?? 0) + 1;
        calls.set(this, count);
        // First read validates import; second is the genuine merge read.
        if (this.name === 'held.pdf' && count === 2) {
          document.documentElement.dataset.mergeStarted = 'yes';
          await new Promise<void>((resolve) => {
            (window as Window & { releaseMerge?: () => void }).releaseMerge =
              resolve;
          });
          document.documentElement.dataset.mergeReleased = 'yes';
          if (corrupt) return new Uint8Array([1, 2, 3]).buffer;
        }
        return original.call(this);
      };
    },
    { corrupt }
  );
}
async function release(page: Page) {
  await page.evaluate(
    () => (window as Window & { releaseMerge?: () => void }).releaseMerge?.()
  );
  await page.waitForFunction(
    () => document.documentElement.dataset.mergeReleased === 'yes'
  );
}
test('downloaded merge preserves every painted page, order and portrait/landscape geometry', async ({
  page
}) => {
  await page.goto(route('/pdf/merge-pdf'));
  await page
    .locator('input[type=file]')
    .setInputFiles([await fixture(), await fixture('second.pdf', [[90, 90]])]);
  const bytes = await download(page);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  expect(pdf.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([
    [120, 210],
    [310, 160],
    [90, 90]
  ]);
  // Independent renderer, actual downloaded bytes, no PDF-lib call mocks.
  await page.goto(route('/pdf/pdf-to-png'));
  await page.locator('input[type=file]').setInputFiles({
    name: 'result.pdf',
    mimeType: 'application/pdf',
    buffer: bytes
  });
  await page
    .getByRole('button', { name: 'Download All as ZIP', exact: true })
    .waitFor({ state: 'visible' });
  const images = page.locator('img[alt^="Preview "]');
  await expect(images).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const pixel = await images.nth(i).evaluate(async (image) => {
      const bitmap = await createImageBitmap(
        await (await fetch((image as HTMLImageElement).src)).blob()
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      try {
        const context = canvas.getContext('2d')!;
        context.drawImage(bitmap, 0, 0);
        return [
          ...context.getImageData(
            Math.floor(canvas.width / 2),
            Math.floor(canvas.height / 2),
            1,
            1
          ).data
        ];
      } finally {
        bitmap.close();
        canvas.width = canvas.height = 0;
      }
    });
    expect(pixel).toEqual(i === 1 ? [0, 0, 255, 255] : [255, 0, 0, 255]);
  }
});
test('Clear during a real merge read invalidates immediately and a new selection recovers', async ({
  page
}) => {
  await gate(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(route('/pdf/merge-pdf'));
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('held.pdf'));
  await page.waitForFunction(
    () => document.documentElement.dataset.mergeStarted === 'yes'
  );
  await expect(page.getByRole('progressbar')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(downloadButton(page)).toBeDisabled();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await release(page);
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('new.pdf', [[77, 88]]));
  expect(
    (await PDFDocument.load(await download(page)))
      .getPages()
      .map((p) => p.getSize())
  ).toEqual([{ width: 77, height: 88 }]);
  expect(errors).toEqual([]);
});
test('deleting input while its merge is pending lets the replacement own the output', async ({
  page
}) => {
  await gate(page);
  await page.goto(route('/pdf/merge-pdf'));
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('held.pdf'));
  await page.waitForFunction(
    () => document.documentElement.dataset.mergeStarted === 'yes'
  );
  await page.getByRole('button', { name: 'Delete file', exact: true }).click();
  await expect(downloadButton(page)).toBeDisabled();
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('new.pdf', [[55, 66]]));
  await expect(downloadButton(page)).toBeEnabled();
  await release(page);
  expect(
    (await PDFDocument.load(await download(page)))
      .getPages()
      .map((p) => p.getSize())
  ).toEqual([{ width: 55, height: 66 }]);
});
test('SPA navigation during a merge consumes late completion and revisiting recovers', async ({
  page
}) => {
  await gate(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(route('/pdf/merge-pdf'));
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('held.pdf'));
  await page.waitForFunction(
    () => document.documentElement.dataset.mergeStarted === 'yes'
  );
  await page.locator('a[href$="/about"]').first().click();
  await expect(page).toHaveURL(/\/about$/);
  await release(page);
  await page.goBack();
  await expect(page.locator('input[type=file]')).toBeAttached();
  await expect(downloadButton(page)).toBeDisabled();
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('new.pdf', [[80, 90]]));
  expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(1);
  expect(errors).toEqual([]);
});
test('merge-time read failure is actionable and a valid subsequent file recovers', async ({
  page
}) => {
  await gate(page, true);
  await page.goto(route('/pdf/merge-pdf'));
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('held.pdf'));
  await page.waitForFunction(
    () => document.documentElement.dataset.mergeStarted === 'yes'
  );
  await release(page);
  await expect(
    page.getByRole('alert').filter({ hasText: 'PDF merge failed' })
  ).toBeVisible();
  await expect(downloadButton(page)).toBeDisabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixture('new.pdf', [[80, 90]]));
  expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(1);
});
test('mobile keyboard Clear removes a completed download without horizontal overflow', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(route('/pdf/merge-pdf'));
  await page.locator('input[type=file]').setInputFiles(await fixture());
  await expect(downloadButton(page)).toBeEnabled();
  const clear = page.getByRole('button', { name: 'Clear', exact: true });
  await clear.focus();
  await page.keyboard.press('Enter');
  await expect(downloadButton(page)).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});
