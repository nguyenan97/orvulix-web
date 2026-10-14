import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import Jimp from 'jimp';

for (const [width, height] of [
  [1600, 100],
  [100, 1600]
]) {
  test(`compress PNG preserves ${width}x${height}, alpha/pixels, filename and file size`, async ({
    page
  }) => {
    const source = new Jimp(width, height, 0xff0000ff);
    source.setPixelColor(0x0000ffff, width - 1, height - 1);
    source.setPixelColor(0x00000000, 0, 0);
    const bytes = await source.getBufferAsync(Jimp.MIME_PNG);
    const external: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).hostname === 'cdn.jsdelivr.net')
        external.push(request.url());
    });
    await page.goto('/png/compress-png');
    const workerAssets = (await readdir('dist/assets')).filter((name) =>
      name.startsWith('browser-image-compression-')
    );
    expect(workerAssets.length).toBeGreaterThan(0);
    for (const workerAsset of workerAssets)
      expect((await page.request.get(`/assets/${workerAsset}`)).status()).toBe(
        200
      );
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'ảnh.png', mimeType: 'image/png', buffer: bytes });
    await expect(page.getByText(/Compressed Size:/)).toBeVisible();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('ảnh.png');
    const output = await readFile((await download.path())!);
    const decoded = await Jimp.read(output);
    expect([decoded.bitmap.width, decoded.bitmap.height]).toEqual([
      width,
      height
    ]);
    expect(decoded.getPixelColor(width - 1, height - 1)).toBe(0x0000ffff);
    expect(Jimp.intToRGBA(decoded.getPixelColor(0, 0)).a).toBe(0);
    expect(output.length).toBeLessThanOrEqual(bytes.length);
    expect(external).toEqual([]);
  });
}
test('invalid rate clears stale output, then valid input recovers', async ({
  page
}) => {
  const bytes = await new Jimp(80, 80, 0xff0000ff).getBufferAsync(
    Jimp.MIME_PNG
  );
  await page.goto('/png/compress-png');
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'valid.png', mimeType: 'image/png', buffer: bytes });
  await expect(page.getByText(/Compressed Size:/)).toBeVisible();
  await page.getByLabel('Palette quality (1-100)').fill('0');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Palette quality must be' })
  ).toBeVisible();
  await expect(page.getByText(/Compressed Size:/)).toHaveCount(0);
  await page.getByLabel('Palette quality (1-100)').fill('60');
  await expect(page.getByText(/Compressed Size:/)).toBeVisible();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Palette quality must be' })
  ).toHaveCount(0);
});
