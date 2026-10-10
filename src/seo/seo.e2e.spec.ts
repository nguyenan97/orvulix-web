import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end SEO checks against the production build (`npm run build &&
 * npm run serve`, see playwright.config.ts). HTTP status codes and Netlify
 * routing are not covered here: Vite preview does not emulate Netlify.
 */

const MANAGED =
  'meta[name="description"],meta[name="robots"],link[rel="canonical"],meta[property^="og:"],meta[name^="twitter:"],script[type="application/ld+json"]';

const headState = (page: Page) =>
  page.evaluate((selector) => {
    const tags = [...document.head.querySelectorAll(selector)].map((element) =>
      JSON.stringify([
        element.tagName.toLowerCase(),
        [...element.attributes]
          .map((attr) => [attr.name, attr.value])
          .sort((a, b) => a[0].localeCompare(b[0])),
        element.tagName === 'SCRIPT' ? element.textContent : ''
      ])
    );
    return {
      title: document.title,
      lang: document.documentElement.lang,
      tags: tags.sort(),
      helmetTags: document.querySelectorAll('[data-react-helmet]').length,
      canonical: document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
      h1: document.querySelectorAll('h1').length,
      staticContent: document.querySelectorAll('#root [data-seo-static]').length
    };
  }, MANAGED);

const waitForApp = async (page: Page, heading: string) => {
  await expect(page.locator('h1', { hasText: heading })).toBeVisible({
    timeout: 30_000
  });
  // RouteSeo applies metadata once translations and overrides are loaded.
  await page.waitForLoadState('networkidle');
};

test('prerendered metadata is kept unchanged after hydration', async ({
  page,
  request
}) => {
  const raw = await (await request.get('/string/uppercase')).text();
  expect(raw).toContain(
    '<link rel="canonical" href="https://orvulix.io.vn/string/uppercase"'
  );
  await page.goto('/string/uppercase');
  const before = await page.evaluate(() => document.title);
  await waitForApp(page, 'Convert to Uppercase');
  const state = await headState(page);
  expect(state.title).toBe(before);
  expect(state.canonical).toBe('https://orvulix.io.vn/string/uppercase');
  expect(state.helmetTags).toBe(0);
  expect(state.staticContent).toBe(0);
  expect(state.h1).toBe(1);
  expect(state.lang).toBe('en');

  const fresh = await page.context().newPage();
  await fresh.route('**/*.js', (route) => route.abort());
  await fresh.goto('/string/uppercase');
  const prerendered = await headState(fresh);
  expect(state.tags).toEqual(prerendered.tags);
  expect(prerendered.staticContent).toBe(1);
});

test('client navigation replaces metadata of the previous route', async ({
  page
}) => {
  await page.goto('/string/uppercase');
  await waitForApp(page, 'Convert to Uppercase');
  await page.locator('a[href="/string/reverse"]').first().click();
  await waitForApp(page, 'Reverse');
  const tool = await headState(page);
  expect(tool.canonical).toBe('https://orvulix.io.vn/string/reverse');
  expect(tool.tags.join('\n')).not.toContain('/string/uppercase');
  expect(tool.tags.filter((tag) => tag.includes('"canonical"'))).toHaveLength(
    1
  );
  expect(
    tool.tags.filter((tag) => tag.includes('application/ld+json'))
  ).toHaveLength(1);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/definitely-missing');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveTitle(/Page Not Found/);
  const missing = await headState(page);
  expect(missing.canonical).toBeUndefined();
  expect(missing.tags.join('\n')).toContain('noindex');
  expect(missing.tags.join('\n')).not.toMatch(/og:|twitter:|ld\+json/);
});
