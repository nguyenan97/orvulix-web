import { expect, test } from '@playwright/test';

test('invalid HEIC async failure reaches the current error UI without pageerror', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Icon CDN availability is unrelated to file processing/error ownership.
  await page.route(
    /^https:\/\/api\.(iconify\.design|simplesvg\.com|unisvg\.com)\//,
    async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          prefix: url.pathname.slice(1).split('.')[0],
          icons: {},
          not_found: (url.searchParams.get('icons') || '').split(',')
        })
      });
    }
  );
  await page.goto('/image-generic/remove-background');
  const picker = page.locator('input[type=file]');
  await picker.setInputFiles({
    name: 'invalid.heic',
    mimeType: 'image/heic',
    buffer: Buffer.from('invalid HEIC fixture')
  });
  await expect(page.getByRole('alert')).toContainText(
    'Failed to remove background'
  );
  expect(errors).toEqual([]);
  // A second invalid job must report again rather than leaving processing stuck.
  await page.reload();
  await picker.setInputFiles({
    name: 'retry.heic',
    mimeType: 'image/heic',
    buffer: Buffer.from('another invalid HEIC')
  });
  await expect(page.getByRole('alert')).toContainText(
    'Failed to remove background'
  );
  expect(errors).toEqual([]);
});
