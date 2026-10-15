import { test, expect, Page } from '@playwright/test';
import Jimp from 'jimp';
import { GifReader } from 'omggif';
import { readFile } from 'node:fs/promises';
async function setup(page: Page) {
  await page.route(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/**',
    async (route) => {
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
  await page.goto('/gif/images-to-gif');
}
async function fixtures(
  formats: readonly ('png' | 'jpeg')[],
  transparent = false
) {
  return Promise.all(
    formats.map(async (f, i) => {
      const image = new Jimp(32, 32, [0xff0000ff, 0x0000ffff, 0x00ff00ff][i]);
      if (transparent && i === 0)
        for (let x = 0; x < 8; x++)
          for (let y = 0; y < 8; y++) image.setPixelColor(0x00000000, x, y);
      return {
        name: `frame-${i}.${f}`,
        mimeType: `image/${f}`,
        buffer: await image.getBufferAsync(`image/${f}`)
      };
    })
  );
}
async function result(page: Page) {
  await page.locator('img[alt=Result]').waitFor();
  const pending = page.waitForEvent('download', {
    predicate: (d) => d.suggestedFilename() === 'animated.gif'
  });
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const gif = new GifReader(await readFile((await (await pending).path())!));
  const pixels = new Uint8Array(gif.width * gif.height * 4),
    centers: number[][] = [],
    corners: number[][] = [],
    delays: number[] = [];
  for (let i = 0; i < gif.numFrames(); i++) {
    gif.decodeAndBlitFrameRGBA(i, pixels);
    delays.push(gif.frameInfo(i).delay);
    centers.push([
      ...pixels.slice((16 * gif.width + 16) * 4, (16 * gif.width + 16) * 4 + 4)
    ]);
    corners.push([...pixels.slice(0, 4)]);
  }
  return {
    width: gif.width,
    height: gif.height,
    frames: gif.numFrames(),
    loop: gif.loopCount(),
    delays,
    centers,
    corners
  };
}
const orders = [
  ['png', 'jpeg'],
  ['jpeg', 'png'],
  ['png', 'jpeg', 'png']
] as const;
for (const formats of orders)
  for (const mode of ['fps', 'delay'] as const)
    test(`${formats.join(
      '-'
    )} ${mode}: actual GIF retains every frame in order and baseline timing`, async ({
      page
    }) => {
      await setup(page);
      if (mode === 'delay') {
        await page.getByText('Frame delay', { exact: true }).click();
        await page.locator('input[type=number]').fill('200');
      }
      await page
        .locator('input[type=file]')
        .setInputFiles(await fixtures(formats));
      const gif = await result(page);
      expect([gif.width, gif.height, gif.loop, gif.frames]).toEqual([
        32,
        32,
        0,
        formats.length + 1
      ]);
      expect(gif.delays).toEqual(
        mode === 'delay'
          ? Array(formats.length + 1).fill(20)
          : formats.length === 2
            ? [12, 8, 8]
            : [12, 8, 12, 12]
      );
      const channels = [0, 2, 1];
      gif.centers.forEach((color, i) => {
        const expected = channels[Math.min(i, formats.length - 1)];
        expect(color[expected]).toBeGreaterThan(200);
        expect(color[3]).toBe(255);
        color.slice(0, 3).forEach((v, c) => {
          if (c !== expected) expect(v).toBeLessThan(40);
        });
      });
    });
test('mixed alpha follows existing homogeneous PNG policy and preserves the following opaque JPEG', async ({
  page
}) => {
  await setup(page);
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixtures(['png', 'png'], true));
  const baseline = await result(page);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixtures(['png', 'jpeg'], true));
  const mixed = await result(page);
  expect(mixed.corners[0]).toEqual(baseline.corners[0]);
  expect(mixed.centers[0]).toEqual(baseline.centers[0]);
  expect(mixed.centers[1][2]).toBeGreaterThan(200);
  expect(mixed.corners[1][3]).toBe(255);
});
test('unequal dimensions produce an actionable error, clear stale output and recover', async ({
  page
}) => {
  await setup(page);
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixtures(['png', 'jpeg']));
  await result(page);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  const files = await fixtures(['png', 'jpeg']);
  files[1].buffer = await new Jimp(64, 32, 0x0000ffff).getBufferAsync(
    Jimp.MIME_JPEG
  );
  await page.locator('input[type=file]').setInputFiles(files);
  await page
    .getByRole('alert')
    .filter({ hasText: 'equal decoded pixel dimensions' })
    .waitFor();
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixtures(['jpeg', 'png']));
  expect((await result(page)).frames).toBe(3);
});
// Forward genuine worker execution. Interact at actual normalization/concat boundaries.
for (const action of [
  'clear-normalize',
  'navigate-normalize',
  'clear-encode'
] as const)
  test(`${action} discards partial mixed work and permits valid retry`, async ({
    page
  }) => {
    await page.addInitScript((action) => {
      const send = Worker.prototype.postMessage;
      let executions = 0;
      Worker.prototype.postMessage = function (
        message: unknown,
        options?: Transferable[] | StructuredSerializeOptions
      ) {
        const data = message as { type?: string; id?: number };
        if (
          data.type === 'EXEC' &&
          ++executions === (action === 'clear-encode' ? 3 : 1)
        ) {
          document.documentElement.dataset.mixedStarted = 'yes';
          const done = (e: MessageEvent) => {
            if (e.data.id === data.id) {
              document.documentElement.dataset.mixedDone = 'yes';
              this.removeEventListener('message', done);
            }
          };
          this.addEventListener('message', done);
          if (action === 'navigate-normalize')
            (
              document.querySelector('a[href="/about"]') as HTMLAnchorElement
            ).click();
          else
            Array.from(document.querySelectorAll('button'))
              .find((b) => b.textContent?.trim() === 'Clear')!
              .click();
        }
        return Reflect.apply(send, this, [message, options]);
      };
    }, action);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setup(page);
    await page
      .locator('input[type=file]')
      .setInputFiles(await fixtures(['png', 'jpeg']));
    await page.waitForFunction(
      () => document.documentElement.dataset.mixedStarted === 'yes'
    );
    if (action === 'navigate-normalize') {
      await expect(page).toHaveURL(/\/about$/);
      await expect(
        page.getByRole('heading', { name: 'About Orvulix', exact: true })
      ).toBeVisible();
    }
    await page.waitForFunction(
      () => document.documentElement.dataset.mixedDone === 'yes'
    );
    if (action === 'navigate-normalize') {
      await page.goBack();
      await expect(
        page.getByRole('button', { name: 'Delete file', exact: true })
      ).toHaveCount(0);
    }
    await expect(
      page.getByRole('button', { name: 'Download', exact: true })
    ).toBeDisabled();
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page
      .locator('input[type=file]')
      .setInputFiles(await fixtures(['jpeg', 'png']));
    await page.locator('input[type=number]').fill('20');
    await page.locator('input[type=number]').fill('10');
    expect((await result(page)).frames).toBe(3);
    expect(errors).toEqual([]);
  });
test('corrupt image batch is rejected by importer without publishing a GIF, then valid mixed input recovers', async ({
  page
}) => {
  await setup(page);
  const files = await fixtures(['png', 'jpeg']);
  files[1].buffer = Buffer.from([255, 216, 255, 0]);
  await page.locator('input[type=file]').setInputFiles(files);
  await page.getByRole('alert').waitFor();
  await expect(
    page.getByRole('button', { name: 'Delete file', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixtures(['png', 'jpeg']));
  expect((await result(page)).frames).toBe(3);
});
test('mixed pixel budget and third-codec policy reject real inputs, then recover', async ({
  page
}) => {
  await setup(page);
  const large = await fixtures(['png', 'jpeg']);
  large[0].buffer = await new Jimp(2001, 2000, 0xff0000ff).getBufferAsync(
    Jimp.MIME_PNG
  );
  await page.locator('input[type=file]').setInputFiles(large);
  await page.getByRole('alert').filter({ hasText: '4 megapixels' }).waitFor();
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles([
    ...(await fixtures(['png', 'jpeg'])),
    {
      name: 'third.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="green"/></svg>'
      )
    }
  ]);
  await page
    .getByRole('alert')
    .filter({ hasText: 'Remove other image formats' })
    .waitFor();
  await expect(
    page.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles(await fixtures(['png', 'jpeg']));
  expect((await result(page)).frames).toBe(3);
});
test('odd-size mixed frames retain legacy scale geometry and timing', async ({
  page
}) => {
  await setup(page);
  const make = async (formats: ('png' | 'jpeg')[]) =>
    Promise.all(
      formats.map(async (f, i) => ({
        name: `odd-${i}.${f}`,
        mimeType: `image/${f}`,
        buffer: await new Jimp(
          31,
          29,
          i ? 0x0000ffff : 0xff0000ff
        ).getBufferAsync(`image/${f}`)
      }))
    );
  await page
    .locator('input[type=file]')
    .setInputFiles(await make(['png', 'png']));
  const baseline = await result(page);
  expect(baseline.width).toBe(31);
  expect(baseline.height % 2).toBe(0);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles(await make(['png', 'jpeg']));
  const mixed = await result(page);
  expect([
    mixed.width,
    mixed.height,
    mixed.frames,
    mixed.loop,
    mixed.delays
  ]).toEqual([
    baseline.width,
    baseline.height,
    baseline.frames,
    baseline.loop,
    baseline.delays
  ]);
  expect(mixed.centers[0][0]).toBeGreaterThan(200);
  expect(mixed.centers[1][2]).toBeGreaterThan(200);
});
