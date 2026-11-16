import { expect, test, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import Jimp from 'jimp';
import { inspectGifFixture } from './testing/inspect-gif';
async function engine(page: Page) {
  await page.route(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/**',
    async (route) => {
      const name = new URL(route.request().url()).pathname.endsWith('.wasm')
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
}
async function fixtures(format: 'png' | 'jpeg' = 'png', singleBlue = false) {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  return Promise.all(
    [singleBlue ? 0x0000ffff : 0xff0000ff, 0x0000ffff].map(
      async (color, index) => ({
        name: `frame-${index}.${format}`,
        mimeType,
        buffer: await new Jimp(32, 32, color).getBufferAsync(
          format === 'png' ? Jimp.MIME_PNG : Jimp.MIME_JPEG
        )
      })
    )
  );
}
async function download(page: Page) {
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page.locator('img[alt=Result]').waitFor({ state: 'visible' });
  const button = page.getByRole('button', { name: 'Download', exact: true });
  await expect(button).toBeEnabled();
  const pending = page.waitForEvent('download', {
    predicate: (result) => result.suggestedFilename() === 'animated.gif'
  });
  await button.click();
  const result = await pending;
  expect(result.suggestedFilename()).toBe('animated.gif');
  return readFile((await result.path())!);
}
function decode(bytes: Buffer) {
  const {
    width,
    height,
    frames,
    loop,
    delays,
    centers: colors
  } = inspectGifFixture(bytes);
  return { width, height, frames, loop, delays, colors };
}

for (const format of ['png', 'jpeg'] as const)
  for (const mode of ['fps', 'delay'] as const) {
    test(`${format} ${mode} preserves baseline GIF dimensions, frame order, loop and timing`, async ({
      page
    }) => {
      await engine(page);
      await page.goto('/gif/images-to-gif');
      if (mode === 'delay') {
        await page.getByText('Frame delay', { exact: true }).click();
        await page.locator('input[type=number]').fill('200');
      }
      await page
        .locator('input[type=file]')
        .setInputFiles(await fixtures(format));
      const gif = decode(await download(page));
      expect({
        width: gif.width,
        height: gif.height,
        frames: gif.frames,
        loop: gif.loop
      }).toEqual({ width: 32, height: 32, frames: 3, loop: 0 });
      expect(gif.delays).toEqual(mode === 'fps' ? [12, 8, 8] : [20, 20, 20]);
      expect(gif.colors[0][0]).toBeGreaterThan(200);
      expect(gif.colors[0][2]).toBeLessThan(40);
      for (const color of gif.colors.slice(1)) {
        expect(color[2]).toBeGreaterThan(200);
        expect(color[0]).toBeLessThan(40);
      }
    });
  }
// Observe the genuine worker boundary and trigger UI interaction deterministically.
// Forward all original messages; do not fabricate encoder output or completion.
async function observeExecution(page: Page) {
  await page.addInitScript(() => {
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (
      message: unknown,
      options?: Transferable[] | StructuredSerializeOptions
    ) {
      const data = message as { type?: string; id?: number };
      if (data.type === 'EXEC' && document.documentElement.dataset.gifAction) {
        document.documentElement.dataset.gifStarted = 'yes';
        const action = document.documentElement.dataset.gifAction;
        delete document.documentElement.dataset.gifAction;
        const done = (event: MessageEvent) => {
          if (event.data.id === data.id) {
            document.documentElement.dataset.gifCompleted = 'yes';
            this.removeEventListener('message', done);
          }
        };
        this.addEventListener('message', done);
        if (action === 'clear')
          Array.from(document.querySelectorAll('button'))
            .find((button) => button.textContent?.trim() === 'Clear')!
            .click();
        if (action === 'navigate')
          (
            document.querySelector('a[href="/about"]') as HTMLAnchorElement
          ).click();
      }
      return Reflect.apply(send, this, [message, options]);
    };
  });
}
test('clear during genuine exec discards late output, then new images/options recover', async ({
  page
}) => {
  await engine(page);
  await observeExecution(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/gif/images-to-gif');
  await page.evaluate(() => {
    document.documentElement.dataset.gifAction = 'clear';
  });
  await page.locator('input[type=file]').setInputFiles(await fixtures());
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page.waitForFunction(
    () => document.documentElement.dataset.gifCompleted === 'yes'
  );
  await expect(
    page.getByRole('button', { name: 'Delete file', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixtures('png', true));
  await page.locator('input[type=number]').fill('20');
  await page.locator('input[type=number]').fill('10');
  const gif = decode(await download(page));
  for (const color of gif.colors) expect(color[2]).toBeGreaterThan(200);
  expect(errors).toEqual([]);
});
test('option/file edits disable old download immediately, clear before Create and recover', async ({
  page
}) => {
  await engine(page);
  await page.goto('/gif/images-to-gif');
  await page.locator('input[type=file]').setInputFiles(await fixtures());
  await download(page);
  await page.getByText('Frames per second (FPS)', { exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeEnabled();
  await page.locator('input[type=number]').fill('20');
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await page.locator('input[type=file]').setInputFiles(await fixtures());
  const gif = decode(await download(page));
  expect(gif.frames).toBeGreaterThan(1);
});
test('SPA unmount at exec boundary ignores late completion and recovers on revisit', async ({
  page
}) => {
  await engine(page);
  await observeExecution(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/gif/images-to-gif');
  await page.evaluate(() => {
    document.documentElement.dataset.gifAction = 'navigate';
  });
  await page.locator('input[type=file]').setInputFiles(await fixtures());
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page.waitForFunction(
    () => document.documentElement.dataset.gifStarted === 'yes'
  );
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole('heading', { name: 'About Orvulix', exact: true })
  ).toBeVisible();
  await page.waitForFunction(
    () => document.documentElement.dataset.gifCompleted === 'yes'
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/gif\/images-to-gif$/);
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.locator('input[type=file]').setInputFiles(await fixtures());
  expect(decode(await download(page)).frames).toBe(3);
  expect(errors).toEqual([]);
});
test('asset-load failure shows a current error without download and valid retry recovers', async ({
  page
}) => {
  let fail = true;
  await page.route(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/**',
    async (route) => {
      if (fail) {
        await route.abort();
        return;
      }
      const name = new URL(route.request().url()).pathname.endsWith('.wasm')
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
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/gif/images-to-gif');
  await page.locator('input[type=file]').setInputFiles(await fixtures());
  await page.getByRole('button', { name: 'Create GIF', exact: true }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'GIF conversion failed' })
    .waitFor({ state: 'visible' });
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  fail = false;
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(await fixtures());
  expect(decode(await download(page)).frames).toBe(3);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});
