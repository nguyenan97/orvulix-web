import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  DEVELOPMENT_HEADING,
  DEVELOPMENT_NOTICE,
  DEVELOPMENT_UPDATES,
  PLANNED_FEATURES
} from '../../seo/roadmap';
const prefix = process.env.COPY_TEST_PREFIX ?? '';
const route = (path: string) => prefix + path;
const copy = (page: Page) =>
  page.getByRole('button', { name: 'Copy to clipboard', exact: true }).last();
interface ClipboardProbe {
  copyValues: string[];
  copyDone: number;
  denyCopy: boolean;
}
declare global {
  interface Window {
    orvulixClipboardProbe: ClipboardProbe;
  }
}
// Positive native clipboard flows require an explicit browser permission setup.
// Firefox/WebKit rely on the real transient user gesture; Chromium supports grants.
test.beforeEach(async ({ context, browserName }) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});
async function nativeProbe(page: Page) {
  await page.addInitScript(() => {
    const state = (window.orvulixClipboardProbe = {
      copyValues: [],
      copyDone: 0,
      denyCopy: false
    } as ClipboardProbe);
    state.copyValues = [];
    state.copyDone = 0;
    state.denyCopy = false;
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: async (text: string) => {
        if (state.denyCopy)
          throw new DOMException('blocked by test policy', 'NotAllowedError');
        state.copyValues.push(text);
        await original(text); // Forward to the actual OS clipboard, never fake success.
        state.copyDone++;
      }
    });
  });
}
test('copies visible Unicode/newlines with the native clipboard, while downloads retain raw escapes', async ({
  page,
  browserName
}) => {
  await nativeProbe(page);
  await page.goto(route('/string/url-decode-string'));
  const raw = 'first\\nsecond\\tViệt Nam 😀';
  await page.getByTestId('text-input').fill(encodeURIComponent(raw));
  await expect(page.getByTestId('text-result')).toHaveValue(
    'first\nsecond\tViệt Nam 😀'
  );
  await copy(page).click();
  await page.waitForFunction(() => window.orvulixClipboardProbe.copyDone === 1);
  expect(
    await page.evaluate(() => window.orvulixClipboardProbe.copyValues)
  ).toEqual(['first\nsecond\tViệt Nam 😀']);
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'first\nsecond\tViệt Nam 😀'
    );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect(await readFile((await (await download).path())!, 'utf8')).toBe(
    'first\\nsecond\\tViệt Nam 😀'
  );
  await page.getByTestId('text-input').fill('next');
  await expect(page.getByTestId('text-result')).toHaveValue('next');
  await copy(page).click();
  await page.waitForFunction(() => window.orvulixClipboardProbe.copyDone === 2);
  expect(
    await page.evaluate(() => window.orvulixClipboardProbe.copyValues.at(-1))
  ).toBe('next');
});
test('missing Clipboard API shows manual-copy guidance without a page error', async ({
  page
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      get: () => undefined
    })
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route('/string/url-decode-string'));
  await page.getByTestId('text-input').fill('safe');
  await expect(page.getByTestId('text-result')).toHaveValue('safe');
  await copy(page).click();
  await expect(
    page.getByText(/Clipboard unavailable.*copy it manually/)
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('denied clipboard access reports a current error and a later user gesture recovers', async ({
  page
}) => {
  await nativeProbe(page);
  await page.goto(route('/string/url-decode-string'));
  await page.getByTestId('text-input').fill('safe');
  await expect(page.getByTestId('text-result')).toHaveValue('safe');
  await page.evaluate(() => {
    window.orvulixClipboardProbe.denyCopy = true;
  });
  await copy(page).click();
  await expect(
    page.getByText(/Clipboard access failed.*copy it manually/)
  ).toBeVisible();
  await page.evaluate(() => {
    window.orvulixClipboardProbe.denyCopy = false;
  });
  await copy(page).click();
  await page.waitForFunction(() => window.orvulixClipboardProbe.copyDone === 1);
  await expect(page.getByText('Text copied', { exact: true })).toBeVisible();
});
test('mobile dark keyboard copy uses the visible result', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await nativeProbe(page);
  await page.goto(route('/string/url-decode-string'));
  await page.getByTestId('text-input').fill('one%5Cntwo');
  await expect(page.getByTestId('text-result')).toHaveValue('one\ntwo');
  await copy(page).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.orvulixClipboardProbe.copyDone === 1);
  expect(
    await page.evaluate(() => window.orvulixClipboardProbe.copyValues[0])
  ).toBe('one\ntwo');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});
test('roadmap static and React views separate verified develop delivery from planned scope', async ({
  page,
  browser,
  baseURL
}) => {
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await noJs.newPage();
    await staticPage.goto(`${baseURL}${route('/roadmap')}`);
    await page.goto(route('/roadmap'));
    const development = page.getByRole('region', { name: DEVELOPMENT_HEADING });
    await expect(development).toBeVisible();
    await expect(development.getByRole('listitem')).toHaveCount(7);
    for (const target of [page, staticPage]) {
      await expect(
        target.getByText(DEVELOPMENT_NOTICE, { exact: true })
      ).toBeVisible();
      for (const update of DEVELOPMENT_UPDATES) {
        await expect(
          target.getByRole('heading', { name: update.title, exact: true })
        ).toBeVisible();
        await expect(
          target.getByText(update.description, { exact: true })
        ).toBeVisible();
      }
      for (const feature of PLANNED_FEATURES)
        await expect(
          target.getByRole('heading', { name: feature.title, exact: true })
        ).toBeVisible();
      if (prefix) {
        await expect(target.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          /noindex/
        );
        await expect(target.locator('link[rel="canonical"]')).toHaveCount(0);
      } else
        await expect(target.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          'https://orvulix.io.vn/roadmap'
        );
    }
    await page.goto(route('/about'));
    await expect(
      page.getByRole('region', { name: DEVELOPMENT_HEADING })
    ).toHaveCount(0);
  } finally {
    await noJs.close();
  }
});
test('mobile light roadmap preserves heading order and readable development scope', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(route('/roadmap'));
  await expect(
    page.getByRole('region', { name: DEVELOPMENT_HEADING })
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Planned features' })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});
