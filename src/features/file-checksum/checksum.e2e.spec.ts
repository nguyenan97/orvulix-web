import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const path = `${prefix}/string/file-checksum`;
const sha256 =
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const sha512 =
  'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f';

test('copies through the native clipboard and fits a narrow viewport', async ({
  page,
  context,
  browserName
}) => {
  test.skip(
    browserName !== 'chromium',
    'Native clipboard readback requires Chromium permission grants.'
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  const choose = page.getByLabel('Choose a file (up to 64 MiB)');
  await choose.focus();
  await expect(choose).toBeFocused();
  await choose.setInputFiles({
    name: 'abc.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('abc')
  });
  const calculate = page.getByRole('button', {
    name: 'Calculate checksum',
    exact: true
  });
  await calculate.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    sha256
  );
  await page.getByRole('button', { name: 'Copy checksum' }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(sha256);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: 'output/playwright/file-checksum-mobile.png',
    fullPage: true
  });
});
test('hashes real file bytes in a native worker and compares, changes algorithm and clears', async ({
  page
}) => {
  await page.goto(path);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') requests.push(request.url());
  });
  await page.getByLabel('Choose a file (up to 64 MiB)').setInputFiles({
    name: 'abc.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('abc')
  });
  await page
    .getByRole('button', { name: 'Calculate checksum', exact: true })
    .click();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    sha256
  );
  await page
    .getByLabel('Expected checksum (optional)')
    .fill(` ${sha256.toUpperCase()} `);
  await expect(
    page.getByText('Checksums match.', { exact: true })
  ).toBeVisible();
  await page.getByLabel('Expected checksum (optional)').fill('0'.repeat(64));
  await expect(
    page.getByText('Checksums do not match.', { exact: true })
  ).toBeVisible();
  await page.getByLabel('Hash algorithm').click();
  await page.getByRole('option', { name: 'SHA-512', exact: true }).click();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    ''
  );
  await expect(
    page.getByRole('button', { name: 'Copy checksum' })
  ).toBeDisabled();
  await expect(
    page.getByText('Enter exactly 128 hexadecimal characters.')
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Calculate checksum', exact: true })
    .click();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    sha512
  );
  await page.getByRole('button', { name: 'Clear file' }).click();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    ''
  );
  await expect(
    page.getByRole('button', { name: 'Calculate checksum', exact: true })
  ).toBeDisabled();
  await page.getByLabel('Choose a file (up to 64 MiB)').setInputFiles({
    name: 'empty.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(0)
  });
  await page
    .getByRole('button', { name: 'Calculate checksum', exact: true })
    .click();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    createHash('sha512').update('').digest('hex')
  );
  const bytes = Buffer.from([0, 255, 128, 13, 10, 0, 65]);
  await page.getByLabel('Choose a file (up to 64 MiB)').setInputFiles({
    name: 'binary.bin',
    mimeType: 'application/octet-stream',
    buffer: bytes
  });
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    ''
  );
  await page
    .getByRole('button', { name: 'Calculate checksum', exact: true })
    .click();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    createHash('sha512').update(bytes).digest('hex')
  );
  expect(requests).toEqual([]);
  if (prefix)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/
    );
});

test('cancels a native worker before completion and recovers, with manual clipboard guidance', async ({
  page
}) => {
  await page.goto(path);
  await page.getByLabel('Choose a file (up to 64 MiB)').setInputFiles({
    name: 'abc.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('abc')
  });
  // Let React commit the enabled Cancel button, before the next worker task.
  await page
    .getByRole('button', { name: 'Calculate checksum', exact: true })
    .evaluate(async (element) => {
      (element as HTMLButtonElement).click();
      await Promise.resolve();
      const cancel = [...document.querySelectorAll('button')].find(
        (button) => button.textContent === 'Cancel calculation'
      );
      if (!cancel || cancel.disabled)
        throw Error('Cancel must be enabled while calculating.');
      cancel.click();
    });
  await expect(
    page.getByText('Calculation cancelled.', { exact: true })
  ).toBeVisible();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    ''
  );
  await page
    .getByRole('button', { name: 'Calculate checksum', exact: true })
    .click();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    sha256
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined
    })
  );
  await page.getByRole('button', { name: 'Copy checksum' }).click();
  await expect(
    page.getByText(
      'Clipboard unavailable. Use HTTPS or select the result and copy it manually.'
    )
  ).toBeVisible();
  await expect(page.getByLabel('File checksum', { exact: true })).toHaveValue(
    sha256
  );
});
