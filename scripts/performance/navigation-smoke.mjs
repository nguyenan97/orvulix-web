import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Run against a production preview or a separately served Pages build.
const base = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
if (!base.pathname.endsWith('/')) throw Error('Base URL must end in /.');
const isPages = process.env.PAGES_SMOKE === 'true';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [path, selector] of [
    ['', 'input[role="combobox"]'],
    ['string/reverse', '[data-testid="text-input"]'],
    ['pdf/split-pdf', 'input[type="file"]']
  ]) {
    const target = new URL(path, base).href;
    await page.goto(target);
    await page
      .locator(selector)
      .first()
      .waitFor({ state: path.startsWith('pdf') ? 'attached' : 'visible' });
    await page.reload();
    await page
      .locator(selector)
      .first()
      .waitFor({ state: path.startsWith('pdf') ? 'attached' : 'visible' });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      ),
      false
    );
    if (isPages) {
      assert.match(
        await page.locator('meta[name="robots"]').getAttribute('content'),
        /noindex/
      );
      assert.equal(await page.locator('link[rel="canonical"]').count(), 0);
    }
    if (path) {
      await page.locator('header a').first().click();
      await page.locator('input[role="combobox"]').waitFor();
      await page.goBack();
      await page
        .locator(selector)
        .first()
        .waitFor({ state: path.startsWith('pdf') ? 'attached' : 'visible' });
      assert.equal(page.url(), target);
      await page.goForward();
      await page.locator('input[role="combobox"]').waitFor();
      assert.equal(new URL(page.url()).pathname, base.pathname);
    }
    console.log(
      `PASS direct/refresh/mobile/navigation: ${path || '/'} (${
        isPages ? 'Pages' : 'production preview'
      })`
    );
  }
  await page.goto(new URL('missing-initial-load-review-route', base).href);
  await page.getByRole('heading', { name: /not found/i }).waitFor();
  assert.match(
    await page.locator('meta[name="robots"]').getAttribute('content'),
    /noindex/
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS unknown client route/noindex and no page errors. HTTP hosting status is not asserted.'
  );
} finally {
  await browser.close();
}
