import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const prefix = process.env.COPY_TEST_PREFIX ?? '';
const route = (path: string) => prefix + path;
const input = '{"message":"Việt Nam 😀","literal":"a\\nb"}';
const formatted = '{\n  "message": "Việt Nam 😀",\n  "literal": "a\\nb"\n}';
type MonacoWindow = Window & { monaco?: typeof import('monaco-editor') };
declare global {
  interface Window {
    codeCopyProbe: { values: string[]; completed: number; denied: boolean };
  }
}
const copy = (page: Page) =>
  page.getByRole('button', { name: 'Copy to clipboard', exact: true }).last();
test.beforeEach(async ({ context, browserName }) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});
async function probe(page: Page) {
  await page.addInitScript(() => {
    const state = (window.codeCopyProbe = {
      values: [] as string[],
      completed: 0,
      denied: false
    });
    const original = navigator.clipboard?.writeText.bind(navigator.clipboard);
    if (original)
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: async (text: string) => {
          if (state.denied)
            throw new DOMException('test permission denial', 'NotAllowedError');
          state.values.push(text);
          await original(text);
          state.completed++;
        }
      });
  });
}
async function loadJson(page: Page) {
  await expect(page.locator('.monaco-editor')).toHaveCount(2);
  await page.locator('input[type=file]').setInputFiles({
    name: 'sample.json',
    mimeType: 'application/json',
    buffer: Buffer.from(input)
  });
  await page.waitForFunction(
    (expected) =>
      (window as MonacoWindow).monaco?.editor
        .getModels()
        .some((model) => model.getValue() === expected),
    formatted
  );
}
test('JSON prettify copies formatted output with valid literal escapes using native clipboard and download', async ({
  page,
  browserName
}) => {
  await probe(page);
  await page.goto(route('/json/prettify'));
  await loadJson(page);
  await copy(page).click();
  await page.waitForFunction(() => window.codeCopyProbe.completed === 1);
  expect(await page.evaluate(() => window.codeCopyProbe.values)).toEqual([
    formatted
  ]);
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      formatted
    );
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const text = await readFile((await (await event).path())!, 'utf8');
  expect(text).toBe(formatted);
  expect(JSON.parse(text)).toEqual({ message: 'Việt Nam 😀', literal: 'a\nb' });
});
test('real insecure HTTP origin reports missing clipboard access without an uncaught error', async ({
  page,
  context,
  baseURL
}) => {
  // Test-only artifact delivery. The browser still enforces genuine HTTP-origin policy.
  // No product proxy, backend or browser security override is installed.
  await context.route('http://clipboard-policy.test/**', async (request) => {
    const path = new URL(request.request().url());
    const response = await request.fetch({
      url: new URL(path.pathname + path.search, baseURL).href,
      headers: {
        ...(await request.request().allHeaders()),
        host: new URL(baseURL!).host
      }
    });
    await request.fulfill({ response });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://clipboard-policy.test' + route('/json/prettify'));
  await loadJson(page);
  expect(await page.evaluate(() => window.isSecureContext)).toBe(false);
  expect(await page.evaluate(() => typeof navigator.clipboard)).toBe(
    'undefined'
  );
  await copy(page).click();
  await expect(
    page.getByText(/Clipboard unavailable.*Use HTTPS.*copy it manually/)
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('code-result permission denial shows guidance and a later gesture recovers', async ({
  page
}) => {
  await probe(page);
  await page.goto(route('/json/prettify'));
  await loadJson(page);
  await page.evaluate(() => {
    window.codeCopyProbe.denied = true;
  });
  await copy(page).click();
  await expect(
    page.getByText(/Clipboard access failed.*copy it manually/)
  ).toBeVisible();
  await page.evaluate(() => {
    window.codeCopyProbe.denied = false;
  });
  await copy(page).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.codeCopyProbe.completed === 1);
  expect(await page.evaluate(() => window.codeCopyProbe.values)).toEqual([
    formatted
  ]);
});
