import { expect, test, type Page } from '@playwright/test';
import Jimp from 'jimp';
import { readFile } from 'node:fs/promises';
import { inspectGifFixture } from './testing/inspect-gif';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
async function setup(page: Page) {
  const requests: string[] = [];
  await page.route(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/**',
    async (route) => {
      requests.push(route.request().url());
      const wasm = route.request().url().endsWith('.wasm');
      await route.fulfill({
        path: `node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.${
          wasm ? 'wasm' : 'js'
        }`,
        contentType: wasm ? 'application/wasm' : 'text/javascript',
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  );
  await page.goto(`${prefix}/gif/images-to-gif`);
  await page.locator('input[type=file]').setInputFiles(
    await Promise.all(
      [0xff0000ff, 0x0000ffff].map(async (color, i) => ({
        name: `frame-${i}.png`,
        mimeType: 'image/png',
        buffer: await new Jimp(32, 32, color).getBufferAsync(Jimp.MIME_PNG)
      }))
    )
  );
  await expect(
    page.getByRole('button', { name: 'Create GIF', exact: true })
  ).toBeEnabled();
  return requests;
}
async function output(page: Page) {
  await page.locator('img[alt=Result]').waitFor();
  const download = page.getByRole('button', { name: 'Download', exact: true });
  await expect(download).toBeEnabled();
  const pending = page.waitForEvent('download');
  await download.click();
  return inspectGifFixture(await readFile((await (await pending).path())!));
}
test('keyboard/mobile timing conversion retains editable drafts, reports adjustments and waits for Create', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await setup(page);
  const fps = page.getByRole('radio', {
    name: 'Frames per second (FPS)',
    exact: true
  });
  const delay = page.getByRole('radio', { name: 'Frame delay', exact: true });
  await fps.focus();
  await page.keyboard.press('ArrowDown');
  await expect(delay).toBeChecked();
  const input = page.getByRole('spinbutton');
  await expect(input).toHaveAccessibleName('Frame delay (ms)');
  await expect(input).toHaveValue('100');
  await input.fill('');
  await expect(
    page.getByRole('button', { name: 'Create GIF', exact: true })
  ).toBeDisabled();
  await expect(
    page.getByText('Enter frame delay between 50 and 10000 ms.')
  ).toBeVisible();
  await input.fill('200');
  await fps.check();
  await expect(input).toHaveAccessibleName('Frame rate (FPS)');
  await expect(input).toHaveValue('5');
  await input.fill('60');
  await delay.check();
  await expect(input).toHaveValue('50');
  await expect(
    page.getByText(/previous timing was invalid or outside/)
  ).toBeVisible();
  await fps.check();
  await input.fill('3');
  await delay.check();
  await expect(input).toHaveValue('333.333333');
  await expect(page.getByText(/Requested timing: 333.333 ms/)).toBeVisible();
  await expect(
    page.getByText(/GIF stores timing in 10 ms ticks/)
  ).toBeVisible();
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page
    .getByRole('radiogroup', { name: 'Timing mode' })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('timing-mobile.png') });
});
test('equivalent FPS and delay requests retain independently decoded timing/order and invalidate old output on invalid edits', async ({
  page
}) => {
  const requests = await setup(page);
  const fps = page.getByRole('radio', {
    name: 'Frames per second (FPS)',
    exact: true
  });
  const delay = page.getByRole('radio', { name: 'Frame delay', exact: true });
  const create = page.getByRole('button', { name: 'Create GIF', exact: true });
  const input = page.getByRole('spinbutton');
  for (const [rate, ticks] of [
    [5, 20],
    [1, 100]
  ]) {
    await fps.check();
    await input.fill(String(rate));
    await delay.check();
    await expect(input).toHaveValue(String(1000 / rate));
    await create.click();
    const gif = await output(page);
    expect([gif.width, gif.height, gif.frames, gif.loop, gif.delays]).toEqual([
      32,
      32,
      3,
      0,
      [ticks, ticks, ticks]
    ]);
    expect(gif.centers[0][0]).toBeGreaterThan(200);
    expect(gif.centers[1][2]).toBeGreaterThan(200);
    await delay.check();
    await expect(
      page.getByRole('button', { name: 'Download', exact: true })
    ).toBeEnabled();
    await input.fill('0');
    await expect(
      page.getByRole('button', { name: 'Download', exact: true })
    ).toBeDisabled();
    await expect(create).toBeDisabled();
  }
  expect(requests).toHaveLength(2); // Installed core JS/WASM only, on the first Create.
});
