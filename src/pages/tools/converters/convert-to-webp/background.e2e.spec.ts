import { expect, test } from '@playwright/test';
import Jimp from 'jimp';
import { readFile } from 'node:fs/promises';

for (const [color, expected] of [
  ['#ff0000', [255, 0, 0]],
  ['#0000ff', [0, 0, 255]],
  ['#ffffff', [255, 255, 255]],
  ['invalid-color', [255, 255, 255]]
] as const) {
  test(`downloaded WebP composites transparent pixels on ${color}`, async ({
    page
  }) => {
    await page.goto('/converters/convert-to-webp');
    await page.getByTestId('background-color-input').fill(color);
    const image = new Jimp(16, 16, 0x00000000);
    // Opaque center verifies that the foreground still survives compositing.
    for (let x = 4; x < 12; x++)
      for (let y = 4; y < 12; y++) image.setPixelColor(0x00ff00ff, x, y);
    const picker = page.locator('input[type=file]');
    await picker.setInputFiles({
      name: 'alpha.png',
      mimeType: 'image/png',
      buffer: await image.getBufferAsync(Jimp.MIME_PNG)
    });
    await page.locator('img[alt=Result]').waitFor();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toMatch(/\.webp$/);
    const bytes = await readFile((await download.path())!);
    expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
    const pixels = await page.evaluate(async (base64) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const bitmap = await createImageBitmap(
        new Blob([bytes], { type: 'image/webp' })
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return {
        width: canvas.width,
        height: canvas.height,
        corner: Array.from(context.getImageData(0, 0, 1, 1).data),
        center: Array.from(context.getImageData(8, 8, 1, 1).data)
      };
    }, bytes.toString('base64'));
    expect([pixels.width, pixels.height]).toEqual([16, 16]);
    // WebP is lossy, so allow small codec quantization differences.
    expected.forEach((channel, index) =>
      expect(Math.abs(pixels.corner[index] - channel)).toBeLessThan(20)
    );
    expect(pixels.corner[3]).toBe(255);
    expect(pixels.center[1]).toBeGreaterThan(230);
    expect(pixels.center[0]).toBeLessThan(20);
    expect(pixels.center[2]).toBeLessThan(20);
  });
}
