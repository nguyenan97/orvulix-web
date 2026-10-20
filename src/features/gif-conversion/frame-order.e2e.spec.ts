import { expect, test, type Page } from '@playwright/test';
import Jimp from 'jimp';
import { readFile } from 'node:fs/promises';
import { inspectGifFixture } from './testing/inspect-gif';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const path = `${prefix}/gif/images-to-gif`;
const create = (page: Page) =>
  page.getByRole('button', { name: 'Create GIF', exact: true });
const download = (page: Page) =>
  page.getByRole('button', { name: 'Download', exact: true });
const order = (page: Page) =>
  page.getByRole('list', { name: 'Frame order', exact: true });
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
  return requests;
}
async function frame(name: string, color: number, jpeg = false) {
  const mimeType = jpeg ? Jimp.MIME_JPEG : Jimp.MIME_PNG;
  return {
    name,
    mimeType,
    buffer: await new Jimp(32, 32, color).getBufferAsync(mimeType)
  };
}
async function readGif(page: Page) {
  await page.locator('img[alt=Result]').waitFor();
  const pending = page.waitForEvent('download', {
    predicate: (file) => file.suggestedFilename() === 'animated.gif'
  });
  await download(page).click();
  return inspectGifFixture(await readFile((await (await pending).path())!));
}
function colors(gif: ReturnType<typeof inspectGifFixture>, channels: number[]) {
  expect(gif.centers).toHaveLength(channels.length);
  for (let i = 0; i < channels.length; i++) {
    expect(gif.centers[i][channels[i]]).toBeGreaterThan(200);
    for (const channel of [0, 1, 2].filter((value) => value !== channels[i]))
      expect(gif.centers[i][channel]).toBeLessThan(40);
  }
}

test('keyboard reorders duplicate filenames, preserves preview URLs and encodes the selected frame pixels', async ({
  page
}) => {
  const requests = await engine(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  const thirdName = `third-${'x'.repeat(180)}.png`;
  await page
    .locator('input[type=file]')
    .setInputFiles([
      await frame('same.png', 0xff0000ff),
      await frame('same.png', 0x0000ffff),
      await frame(thirdName, 0x00ff00ff)
    ]);
  await expect(order(page).getByRole('listitem')).toHaveCount(3);
  const previews = page
    .getByRole('region', { name: 'File drop zone' })
    .locator('img');
  const original = await previews.evaluateAll((images) =>
    images.map((image) => image.getAttribute('src'))
  );
  await page
    .getByRole('button', {
      name: 'Move frame 2 earlier: same.png',
      exact: true
    })
    .focus();
  await page.keyboard.press('Enter');
  await expect(
    order(page).getByRole('listitem', {
      name: 'Frame 1: same.png',
      exact: true
    })
  ).toBeFocused();
  await expect(
    page.getByRole('button', {
      name: 'Move frame 1 earlier: same.png',
      exact: true
    })
  ).toBeDisabled();
  expect(
    await previews.evaluateAll((images) =>
      images.map((image) => image.getAttribute('src'))
    )
  ).toEqual([original[1], original[0], original[2]]);
  await expect
    .poll(() =>
      previews.evaluateAll((images) =>
        images.every(
          (image) =>
            (image as HTMLImageElement).complete &&
            (image as HTMLImageElement).naturalWidth === 32
        )
      )
    )
    .toBe(true);
  await page.getByText('Frame delay', { exact: true }).click();
  await page.locator('input[type=number]').fill('200');
  // Observe absence of automatic encoding beyond the former 1000ms debounce.
  await page.waitForTimeout(1200);
  expect(requests).toEqual([]);
  await create(page).click();
  const first = await readGif(page);
  expect([
    first.width,
    first.height,
    first.frames,
    first.loop,
    first.delays
  ]).toEqual([32, 32, 4, 0, [20, 20, 20, 20]]);
  colors(first, [2, 0, 1, 1]);
  await page
    .getByRole('button', {
      name: `Move frame 3 earlier: ${thirdName}`,
      exact: true
    })
    .click();
  await expect(download(page)).toBeDisabled();
  await order(page).scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: `output/playwright/gif-order-mobile-${test.info().project.name}.png`
  });
  await create(page).click();
  colors(await readGif(page), [2, 1, 0, 0]);
  if (prefix)
    await expect(page.locator('meta[name=robots]')).toHaveAttribute(
      'content',
      /noindex/
    );
});

test('reordering at genuine mixed-image encode EXEC discards late output and retries in the new order', async ({
  page
}) => {
  await engine(page);
  await page.addInitScript(() => {
    const send = Worker.prototype.postMessage;
    let executions = 0;
    Worker.prototype.postMessage = function (
      message: unknown,
      options?: Transferable[] | StructuredSerializeOptions
    ) {
      const data = message as { type?: string; id?: number };
      if (data.type === 'EXEC') {
        document.documentElement.dataset.orderExecs = String(++executions);
        if (executions === 3) {
          this.addEventListener('message', function done(event: MessageEvent) {
            if (event.data.id === data.id) {
              document.documentElement.dataset.orderExecDone = 'yes';
              this.removeEventListener('message', done);
            }
          });
          const move = document.querySelector(
            'button[aria-label="Move frame 2 earlier: blue.jpg"]'
          ) as HTMLButtonElement;
          move.click();
          const create = [...document.querySelectorAll('button')].find(
            (button) => button.textContent === 'Create GIF'
          )!;
          document.documentElement.dataset.orderBusy = create.disabled
            ? 'yes'
            : 'no';
        }
      }
      return Reflect.apply(send, this, [message, options]);
    };
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(path);
  await page
    .locator('input[type=file]')
    .setInputFiles([
      await frame('red.png', 0xff0000ff),
      await frame('blue.jpg', 0x0000ffff, true)
    ]);
  await page.getByText('Frame delay', { exact: true }).click();
  await page.locator('input[type=number]').fill('200');
  await create(page).click();
  await page.waitForFunction(
    () => document.documentElement.dataset.orderExecDone === 'yes'
  );
  await expect(page.locator('html')).toHaveAttribute('data-order-busy', 'yes');
  await expect(create(page)).toBeEnabled();
  await expect(download(page)).toBeDisabled();
  await expect(order(page).getByRole('listitem').first()).toHaveAccessibleName(
    'Frame 1: blue.jpg'
  );
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-order-execs', '3');
  await create(page).click();
  const gif = await readGif(page);
  expect([gif.width, gif.height, gif.frames, gif.loop, gif.delays]).toEqual([
    32,
    32,
    3,
    0,
    [20, 20, 20]
  ]);
  colors(gif, [2, 0, 0]);
  await expect(page.locator('html')).toHaveAttribute('data-order-execs', '6');
  expect(errors).toEqual([]);
});

test('reorder cancels a held real import read, then append/remove/Clear/navigation retain correct preview ownership', async ({
  page
}) => {
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.addInitScript(() => {
    const read = Blob.prototype.arrayBuffer;
    Blob.prototype.arrayBuffer = async function () {
      const bytes = await Reflect.apply(read, this, []);
      if (document.documentElement.dataset.holdOrderImport === 'yes') {
        delete document.documentElement.dataset.holdOrderImport;
        document.documentElement.dataset.orderImportHeld = 'yes';
        await new Promise<void>((resolve) =>
          document.addEventListener('release-order-import', () => resolve(), {
            once: true
          })
        );
      }
      return bytes;
    };
    const revoke = URL.revokeObjectURL;
    const revoked: string[] = [];
    URL.revokeObjectURL = (url) => {
      revoked.push(url);
      document.documentElement.dataset.orderRevoked = JSON.stringify(revoked);
      return revoke(url);
    };
  });
  await page.goto(path);
  await page
    .locator('input[type=file]')
    .setInputFiles([
      await frame('red.png', 0xff0000ff),
      await frame('blue.png', 0x0000ffff)
    ]);
  await expect(order(page).getByRole('listitem')).toHaveCount(2);
  const previews = page
    .getByRole('region', { name: 'File drop zone' })
    .locator('img');
  const urls = await previews.evaluateAll((images) =>
    images.map((image) => image.getAttribute('src')!)
  );
  await page.evaluate(() => {
    document.documentElement.dataset.holdOrderImport = 'yes';
  });
  await page
    .locator('input[type=file]')
    .setInputFiles(await frame('late.png', 0x00ff00ff));
  await page.waitForFunction(
    () => document.documentElement.dataset.orderImportHeld === 'yes'
  );
  await page
    .getByRole('button', {
      name: 'Move frame 2 earlier: blue.png',
      exact: true
    })
    .click();
  await expect(
    page.getByRole('region', { name: 'File drop zone' })
  ).toHaveAttribute('aria-busy', 'false');
  await page.evaluate(() =>
    document.dispatchEvent(new Event('release-order-import'))
  );
  await page
    .locator('input[type=file]')
    .setInputFiles(await frame('<img src=x onerror=alert(1)>.png', 0x00ff00ff));
  await expect(order(page).getByRole('listitem')).toHaveCount(3);
  await expect(order(page).getByRole('listitem')).toHaveText([
    'blue.pngMove earlierMove later',
    'red.pngMove earlierMove later',
    '<img src=x onerror=alert(1)>.pngMove earlierMove later'
  ]);
  await expect(order(page).locator('img')).toHaveCount(0);
  expect(dialogs).toEqual([]);
  expect(
    await previews.evaluateAll((images) =>
      images.map((image) => image.getAttribute('src'))
    )
  ).toEqual([urls[1], urls[0], expect.any(String)]);
  const retainedRevoked = await page.evaluate(
    () =>
      JSON.parse(
        document.documentElement.dataset.orderRevoked ?? '[]'
      ) as string[]
  );
  for (const url of urls) expect(retainedRevoked).not.toContain(url);
  await page
    .getByRole('button', { name: 'Delete file', exact: true })
    .nth(1)
    .click();
  await expect(order(page).getByRole('listitem')).toHaveCount(2);
  await expect(order(page).getByRole('listitem').first()).toHaveAccessibleName(
    'Frame 1: blue.png'
  );
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(order(page)).toHaveCount(0);
  const cleared = await page.evaluate(
    () =>
      JSON.parse(
        document.documentElement.dataset.orderRevoked ?? '[]'
      ) as string[]
  );
  for (const url of urls) expect(cleared).toContain(url);
  await page
    .locator('input[type=file]')
    .setInputFiles(await frame('final.png', 0xff0000ff));
  await expect(order(page).getByRole('listitem')).toHaveCount(1);
  const finalUrl = await previews.first().getAttribute('src');
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          document.documentElement.dataset.orderRevoked ?? '[]'
        ) as string[]
    )
  ).toContain(finalUrl);
});
