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
// Cache the app's actual pinned CDN renderer, not a replacement/editor mock.
// Asset setup is separate from per-test readiness/clipboard deadlines.
const monacoOrigin =
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/';
const rendererAssets = new Map<string, { body: Buffer; contentType: string }>();
test.beforeAll(async ({ playwright }) => {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const request = await playwright.request.newContext({
    proxy: proxy ? { server: proxy } : undefined
  });
  try {
    await Promise.all(
      [
        'loader.js',
        'editor/editor.main.js',
        'editor/editor.main.css',
        'language/json/jsonMode.js',
        'base/worker/workerMain.js',
        'language/json/jsonWorker.js',
        'base/browser/ui/codicons/codicon/codicon.ttf'
      ].map(async (path) => {
        const url = monacoOrigin + path;
        const response = await request.get(url);
        expect(response.ok(), `Monaco fixture fetch: ${path}`).toBe(true);
        rendererAssets.set(url, {
          body: await response.body(),
          contentType: response.headers()['content-type']
        });
      })
    );
  } finally {
    await request.dispose();
  }
});
test.beforeEach(async ({ context, browserName }) => {
  await context.route(monacoOrigin + '**', async (route) => {
    const asset = rendererAssets.get(route.request().url());
    if (!asset) {
      await route.continue();
      return;
    }
    await route.fulfill({
      body: asset.body,
      contentType: asset.contentType,
      headers: { 'access-control-allow-origin': '*' }
    });
  });
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
  // Actual renderer initialization, bounded by the unchanged test deadline.
  await page.waitForFunction(
    () => (window as MonacoWindow).monaco?.editor.getModels().length === 2
  );
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
for (const target of ['input', 'result'] as const)
  test(`${target} real insecure HTTP origin reports missing clipboard access without an uncaught error`, async ({
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
    const chooserEvent = page.waitForEvent('filechooser');
    await page
      .getByRole('button', { name: 'Select files', exact: true })
      .click();
    await (
      await chooserEvent
    ).setFiles({
      name: 'source.json',
      mimeType: 'application/json',
      buffer: Buffer.from(input)
    });
    const button =
      target === 'result'
        ? copy(page)
        : page
            .getByRole('button', { name: 'Copy to clipboard', exact: true })
            .first();
    await button.click();
    await expect(
      page.getByText(/Clipboard unavailable.*Use HTTPS.*copy it manually/)
    ).toBeVisible();
    await button.focus();
    await page.keyboard.press('Enter');
    expect(errors).toEqual([]);
  });
for (const target of ['input', 'result'] as const)
  test(`${target} code permission denial shows guidance and a later gesture recovers`, async ({
    page
  }) => {
    await probe(page);
    await page.goto(route('/json/prettify'));
    await loadJson(page);
    await page.evaluate(() => {
      window.codeCopyProbe.denied = true;
    });
    const button =
      target === 'result'
        ? copy(page)
        : page
            .getByRole('button', { name: 'Copy to clipboard', exact: true })
            .first();
    await button.click();
    await expect(
      page.getByText(/Clipboard access failed.*copy it manually/)
    ).toBeVisible();
    await page.evaluate(() => {
      window.codeCopyProbe.denied = false;
    });
    await button.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.codeCopyProbe.completed === 1);
    expect(await page.evaluate(() => window.codeCopyProbe.values)).toEqual([
      target === 'result' ? formatted : input
    ]);
  });

test('JSON code input copies raw source and subsequent editor changes using native clipboard', async ({
  page,
  browserName
}) => {
  await probe(page);
  await page.goto(route('/json/prettify'));
  await loadJson(page);
  const button = page
    .getByRole('button', { name: 'Copy to clipboard', exact: true })
    .first();
  await button.click();
  await page.waitForFunction(() => window.codeCopyProbe.completed === 1);
  expect(await page.evaluate(() => window.codeCopyProbe.values)).toEqual([
    input
  ]);
  const next = '{"next":"new\\tvalue"}';
  const editor = page
    .locator('.monaco-editor')
    .first()
    .locator('textarea.inputarea');
  await editor.focus();
  const selectAll = await page.evaluate(() =>
    navigator.userAgent.includes('Macintosh') ? 'Meta+A' : 'Control+A'
  );
  await editor.press(selectAll);
  await editor.press('Backspace');
  await page.waitForFunction(
    () =>
      (window as MonacoWindow).monaco?.editor
        .getModels()
        .some((model) => model.getValue() === '')
  );
  await editor.pressSequentially(next);
  await page.waitForFunction(
    (expected) =>
      (window as MonacoWindow).monaco?.editor
        .getModels()
        .some((model) => model.getValue() === expected),
    next
  );
  await button.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.codeCopyProbe.completed === 2);
  expect(await page.evaluate(() => window.codeCopyProbe.values)).toEqual([
    input,
    next
  ]);
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      next
    );
});
