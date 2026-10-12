import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function decode(page: Page, bytes: Buffer) {
  return page.evaluate(async (base64) => {
    const blob = await (
      await fetch(`data:application/octet-stream;base64,${base64}`)
    ).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const corner = [
      ...ctx.getImageData(bitmap.width - 1, bitmap.height - 1, 1, 1).data
    ];
    const interior = [...ctx.getImageData(20, 20, 1, 1).data];
    bitmap.close();
    return { width: canvas.width, height: canvas.height, corner, interior };
  }, bytes.toString('base64'));
}
test('paste, preview and download a real PNG, then clear stale output on edit', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title="Sanitized HTML preview"]')
      .getByText('Total: $400')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const bytes = await readFile((await (await download).path())!);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const image = await decode(page, bytes);
  expect([image.width, image.height]).toEqual([800, 600]);
  expect(image.interior).toEqual([240, 253, 250, 255]);
  await page.getByLabel('HTML markup').fill('<p>New input</p>');
  await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveCount(0);
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
});
test('upload HTML, JPEG and transparent PNG export use actual chosen options', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  await page.getByLabel('Upload HTML file').setInputFiles({
    name: 'invoice.html',
    mimeType: 'text/html',
    buffer: Buffer.from('<p>Nguyễn An</p>')
  });
  await page.getByLabel('Width (px)').fill('400');
  await page.getByLabel('Height (px)').fill('200');
  await page.getByLabel('Background', { exact: true }).click();
  await page.getByRole('option', { name: 'Transparent' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  let downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  let image = await decode(
    page,
    await readFile((await (await downloaded).path())!)
  );
  expect([image.width, image.height]).toEqual([400, 200]);
  expect(image.corner[3]).toBe(0);
  await page.getByLabel('Format', { exact: true }).click();
  await page.getByRole('option', { name: 'JPEG' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download JPEG' }).click();
  const bytes = await readFile((await (await downloaded).path())!);
  expect([...bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
  image = await decode(page, bytes);
  expect(image.corner).toEqual([255, 255, 255, 255]);
});
test('removes hostile markup with no content requests and recovers from limits', async ({
  page
}) => {
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('blocked.test')) requests.push(r.url());
  });
  await page.goto('/image-generic/html-to-image');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<script>parent.__htmlAttack=true</script><img src="https://blocked.test/x"><style>@import "https://blocked.test/css"</style><div id="constructor" onclick="alert(1)" style="background-image:url(https://blocked.test/bg);color:red">Safe</div>'
    );
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  expect(requests).toEqual([]);
  await expect(
    page
      .frameLocator('iframe[title="Sanitized HTML preview"]')
      .locator('[id], [onclick], img, script, style:not(head style)')
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Object.prototype.hasOwnProperty.call(window, '__htmlAttack')
    )
  ).toBe(false);
  await page.getByLabel('Width (px)').fill('1280');
  await page.getByLabel('Height (px)').fill('1080');
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(
    page.getByText('Output exceeds 2 megapixels. Reduce dimensions or scale.')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restore default options' }).click();
  await page.getByLabel('HTML markup').press('Control+Enter');
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
});
test('mobile layout, empty/unsupported files, cancel and reset remain usable', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/image-generic/html-to-image');
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(
    page.getByText('Enter HTML or upload an HTML file.')
  ).toBeVisible();
  await page.getByLabel('Upload HTML file').setInputFiles({
    name: 'bad.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hi')
  });
  await expect(page.getByText('Choose an .html or .htm file.')).toBeVisible();
  await page.getByLabel('Upload HTML file').setInputFiles({
    name: 'large.html',
    mimeType: 'text/html',
    buffer: Buffer.alloc(65537, 'a')
  });
  await expect(page.getByText('HTML must be at most 64 KiB.')).toBeVisible();
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.route('**/assets/renderer-*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });
  await page.getByRole('button', { name: 'Convert to image' }).click();
  // Keyboard activation avoids pointer waits that can outlast a short capture.
  await page
    .getByRole('button', { name: 'Cancel', exact: true })
    .press('Enter');
  await expect(
    page.getByText('Conversion cancelled. Edit or convert again to retry.')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('HTML markup')).toHaveValue('');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
});

test('dark mode does not leak into the image and 2x scale changes actual pixels', async ({
  page
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/image-generic/html-to-image');
  await page.getByLabel('HTML markup').fill('<p>Dark-mode invoice</p>');
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const result = await decode(
    page,
    await readFile((await (await downloaded).path())!)
  );
  expect([result.width, result.height]).toEqual([1600, 1200]);
  expect(result.corner).toEqual([255, 255, 255, 255]);
  await page.goto('/');
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
});
