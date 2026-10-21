import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import Jimp from 'jimp';
import {
  fixtures,
  chunks,
  chunk,
  filtered,
  nonIdat
} from '../../../scripts/research/png-fixtures.mjs';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const route = `${prefix}/png/lossless-png`;

test('downloads exact samples and metadata for static PNG corpus without inflation or upload', async ({
  page
}) => {
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') posts.push(r.url());
  });
  await page.goto(route);
  const choose = page.getByLabel('Choose a PNG (up to 4 MiB)'),
    optimize = page.getByRole('button', { name: 'Optimize PNG', exact: true });
  for (const fixture of fixtures()) {
    await choose.setInputFiles({
      name: `ảnh-${fixture.name}.png`,
      mimeType: 'image/png',
      buffer: fixture.png
    });
    await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveCount(
      0
    );
    await optimize.click();
    const link = page.getByRole('link', { name: 'Download PNG' });
    await expect(link).toBeVisible();
    const pending = page.waitForEvent('download');
    await link.click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(`ảnh-${fixture.name}.png`);
    const output = await readFile((await download.path())!);
    expect(output.length).toBeLessThanOrEqual(fixture.png.length);
    expect(filtered(output)).toEqual(filtered(fixture.png));
    expect(nonIdat(output)).toEqual(nonIdat(fixture.png));
    const original = await Jimp.read(fixture.png),
      decoded = await Jimp.read(output);
    expect(decoded.bitmap.data).toEqual(original.bitmap.data);
    if (fixture.name === 'flat-zlib9') expect(output).toEqual(fixture.png);
  }
  expect(posts).toEqual([]);
});

test('rejects corrupt/overexpanded input then recovers with the same picker and keyboard on mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const choose = page.getByLabel('Choose a PNG (up to 4 MiB)'),
    optimize = page.getByRole('button', { name: 'Optimize PNG', exact: true });
  const good = fixtures()[0].png,
    bad = Buffer.from(good);
  bad[29] ^= 1;
  const items = chunks(good),
    h = Buffer.from(items[0].data);
  h.writeUInt32BE(1, 0);
  h.writeUInt32BE(1, 4);
  const expanded = Buffer.concat([
    good.subarray(0, 8),
    chunk('IHDR', h),
    chunk('IDAT', Buffer.from(deflateSync(Buffer.alloc(100_000)))),
    chunk('IEND')
  ]);
  const trailing = Buffer.concat([
    good.subarray(0, 8),
    items[0].bytes,
    chunk('IDAT', Buffer.concat([items[1].data, Buffer.from([1, 2, 3])])),
    items[2].bytes
  ]);
  for (const bytes of [bad, expanded, trailing]) {
    await choose.setInputFiles({
      name: 'invalid.png',
      mimeType: 'image/png',
      buffer: bytes
    });
    await optimize.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveCount(
      0
    );
  }
  const name = `<img onerror=alert(1)>-${'long-'.repeat(20)}.png`;
  await choose.setInputFiles({ name, mimeType: 'image/png', buffer: good });
  await optimize.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: `output/playwright/lossless-png-${test.info().project.name}.png`,
    fullPage: true
  });
  if (prefix)
    await expect(page.locator('meta[name=robots]')).toHaveAttribute(
      'content',
      /noindex/
    );
});

test('Cancel, replacement, Clear and navigation terminate real workers and never restore stale downloads', async ({
  page
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as {
      hold: boolean;
      release?: () => void;
      terminated: number;
    };
    state.hold = true;
    state.terminated = 0;
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      private png: boolean;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.png = String(url).includes('optimize.worker');
      }
      postMessage(data: unknown) {
        if (this.png && state.hold)
          state.release = () => super.postMessage(data);
        else super.postMessage(data);
      }
      terminate() {
        if (this.png) state.terminated++;
        super.terminate();
      }
    };
  });
  await page.goto(route);
  const choose = page.getByLabel('Choose a PNG (up to 4 MiB)'),
    optimize = page.getByRole('button', { name: 'Optimize PNG', exact: true });
  const file = {
    name: 'same.png',
    mimeType: 'image/png',
    buffer: fixtures()[0].png
  };
  for (const action of ['cancel', 'replace', 'clear']) {
    await choose.setInputFiles(file);
    await optimize.click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Optimizing PNG' })
    ).toBeVisible();
    if (action === 'cancel')
      await page.getByRole('button', { name: 'Cancel optimization' }).click();
    if (action === 'replace')
      await choose.setInputFiles({ ...file, name: 'next.png' });
    if (action === 'clear')
      await page.getByRole('button', { name: 'Clear file' }).click();
    await page.evaluate(() => {
      const s = window as unknown as { release?: () => void };
      s.release?.();
    });
    await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveCount(
      0
    );
  }
  expect(
    await page.evaluate(
      () => (window as unknown as { terminated: number }).terminated
    )
  ).toBe(3);
  await choose.setInputFiles(file);
  await optimize.click();
  await page.evaluate(() => {
    const s = window as unknown as { hold: boolean; release?: () => void };
    s.hold = false;
    s.release?.();
  });
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { hold: boolean }).hold = true;
  });
  await optimize.click();
  await page
    .locator('footer')
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  expect(
    await page.evaluate(
      () => (window as unknown as { terminated: number }).terminated
    )
  ).toBe(5);
});
