import { expect, test } from '@playwright/test';
import { deferTextReads } from './testing/defer-reads';
const prefix = process.env.COPY_TEST_PREFIX ?? '';
// Defer only I/O startup, then use the native FileReader implementation/decoding.
// Unit tests separately deliver queued callbacks after actual aborts.
test('text file retries, stale reads, edit ownership and navigation recovery', async ({
  page
}) => {
  const release = await deferTextReads(page);
  await page.goto(prefix + '/string/url-decode-string');
  const input = page.getByTestId('text-input');
  const picker = page.locator('input[type=file]');
  const sample = {
    name: 'Việt Nam.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Việt Nam 😀\n literal\\n')
  };
  await picker.setInputFiles(sample);
  await release();
  await expect(input).toHaveValue('Việt Nam 😀\n literal\\n');
  await input.fill('edit');
  await picker.setInputFiles(sample); // Same-file retry must remain possible.
  await release();
  await expect(input).toHaveValue('Việt Nam 😀\n literal\\n');
  await picker.setInputFiles(sample);
  await input.fill('newer edit');
  await release();
  await expect(input).toHaveValue('newer edit');
  await picker.setInputFiles(sample);
  await picker.setInputFiles({
    ...sample,
    name: 'latest.txt',
    buffer: Buffer.from('latest')
  });
  await release();
  await expect(input).toHaveValue('latest');
  await picker.setInputFiles({ ...sample, buffer: Buffer.alloc(0) });
  await release();
  await expect(input).toHaveValue('');
  await picker.setInputFiles(sample);
  // Real SPA unmount, without discarding the pending reader via document reload.
  await page.evaluate((path) => {
    history.pushState(null, '', path);
    dispatchEvent(new PopStateEvent('popstate'));
  }, prefix + '/');
  await expect(input).toHaveCount(0);
  await release();
  await page.goto(prefix + '/string/url-decode-string');
  await picker.setInputFiles(sample);
  await release();
  await expect(input).toHaveValue('Việt Nam 😀\n literal\\n');
});
