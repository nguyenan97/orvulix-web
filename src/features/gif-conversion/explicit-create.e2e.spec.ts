import { expect, test, type Page } from '@playwright/test';
import Jimp from 'jimp';
import { readFile } from 'node:fs/promises';
import { inspectGifFixture } from './testing/inspect-gif';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const path = `${prefix}/gif/images-to-gif`;
async function engine(page: Page) {
  const requests: string[] = [];
  await page.route(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/**',
    async (route) => {
      requests.push(route.request().url());
      const name = route.request().url().endsWith('.wasm')
        ? 'ffmpeg-core.wasm'
        : 'ffmpeg-core.js';
      await route.fulfill({
        path: `node_modules/@ffmpeg/core/dist/esm/${name}`,
        contentType: name.endsWith('.wasm')
          ? 'application/wasm'
          : 'text/javascript',
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  );
  await page.addInitScript(() => {
    const send = Worker.prototype.postMessage;
    let executions = 0;
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        document.documentElement.dataset.explicitExecs = String(executions);
      },
      { once: true }
    );
    Worker.prototype.postMessage = function (
      message: unknown,
      options?: Transferable[] | StructuredSerializeOptions
    ) {
      const data = message as { type?: string; id?: number };
      if (data.type === 'EXEC') {
        document.documentElement.dataset.explicitExecs = String(++executions);
        if (document.documentElement.dataset.cancelGif === 'yes') {
          delete document.documentElement.dataset.cancelGif;
          this.addEventListener('message', function done(event: MessageEvent) {
            if (event.data.id === data.id) {
              document.documentElement.dataset.cancelledExecCompleted = 'yes';
              this.removeEventListener('message', done);
            }
          });
          [...document.querySelectorAll('button')]
            .find((button) => button.textContent === 'Cancel GIF creation')!
            .click();
        }
      }
      return Reflect.apply(send, this, [message, options]);
    };
  });
  return requests;
}
async function frames() {
  return Promise.all(
    [0xff0000ff, 0x0000ffff].map(async (color, index) => ({
      name: `frame-${index}.png`,
      mimeType: 'image/png',
      buffer: await new Jimp(32, 32, color).getBufferAsync(Jimp.MIME_PNG)
    }))
  );
}
async function readGif(page: Page) {
  await page.locator('img[alt=Result]').waitFor();
  const pending = page.waitForEvent('download', {
    predicate: (download) => download.suggestedFilename() === 'animated.gif'
  });
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  return inspectGifFixture(await readFile((await (await pending).path())!));
}
test('imports/edits do not start FFmpeg; keyboard Create encodes the chosen timing and preserves real output', async ({
  page
}) => {
  const requests = await engine(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  const create = page.getByRole('button', { name: 'Create GIF', exact: true });
  await expect(create).toBeDisabled();
  await page.locator('input[type=file]').setInputFiles(await frames());
  await expect(create).toBeEnabled();
  // Negative behavior observation beyond the former 1000ms debounce, not a readiness delay.
  await page.waitForTimeout(1200);
  expect(requests).toEqual([]);
  await expect(page.locator('html')).toHaveAttribute(
    'data-explicit-execs',
    '0'
  );
  await page.getByText('Frame delay', { exact: true }).click();
  await page.locator('input[type=number]').fill('200');
  await page.waitForTimeout(1200);
  expect(requests).toEqual([]);
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await create.focus();
  await page.keyboard.press('Enter');
  const gif = await readGif(page);
  expect([gif.width, gif.height, gif.frames, gif.loop, gif.delays]).toEqual([
    32,
    32,
    3,
    0,
    [20, 20, 20]
  ]);
  expect(gif.centers[0][0]).toBeGreaterThan(200);
  expect(gif.centers[1][2]).toBeGreaterThan(200);
  await expect(page.locator('html')).toHaveAttribute(
    'data-explicit-execs',
    '1'
  );
  await page.locator('input[type=number]').fill('250');
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.waitForTimeout(1200);
  await expect(page.locator('html')).toHaveAttribute(
    'data-explicit-execs',
    '1'
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await create.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `output/playwright/gif-create-mobile-${test.info().project.name}.png`
  });
  if (prefix)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/
    );
});
test('Cancel at genuine worker EXEC discards output, then an explicit retry succeeds', async ({
  page
}) => {
  await engine(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(path);
  await page.locator('input[type=file]').setInputFiles(await frames());
  await page.evaluate(() => {
    document.documentElement.dataset.cancelGif = 'yes';
  });
  const create = page.getByRole('button', { name: 'Create GIF', exact: true });
  await create.click();
  await page.waitForFunction(
    () => document.documentElement.dataset.cancelledExecCompleted === 'yes'
  );
  await expect(create).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await expect(
    page.getByRole('alert').filter({ hasText: 'GIF creation cancelled' })
  ).toBeVisible();
  await create.click();
  expect((await readGif(page)).frames).toBe(3);
  await expect(page.locator('html')).toHaveAttribute(
    'data-explicit-execs',
    '2'
  );
  expect(errors).toEqual([]);
});
