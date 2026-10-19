import { expect, test } from '@playwright/test';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const path = `${prefix}/number/data-transfer-time`;
test('uses explicit bit/byte units and efficiency for current estimates', async ({
  page
}) => {
  await page.goto(path);
  await expect(
    page.getByRole('region', { name: 'Transfer estimate' })
  ).toHaveCount(0);
  await page.getByLabel('Data size', { exact: true }).fill('1');
  await page.getByLabel('Transfer rate', { exact: true }).fill('100');
  await expect(page.getByTestId('transfer-duration')).toHaveText('1 min 20 s');
  await expect(page.getByTestId('transfer-seconds')).toHaveText(
    'Approximately 80 seconds'
  );
  await page.getByLabel('Efficiency (%)').fill('80');
  await expect(page.getByTestId('transfer-duration')).toHaveText('1 min 40 s');
  await expect(page.getByTestId('transfer-effective-rate')).toHaveText(
    'Effective rate: approximately 80,000,000 bits/s'
  );
  await page.getByLabel('Transfer rate unit', { exact: true }).click();
  await page
    .getByRole('option', { name: 'MB/s (megabytes/second)', exact: true })
    .click();
  await expect(page.getByTestId('transfer-seconds')).toHaveText(
    'Approximately 12.5 seconds'
  );
  await page.getByLabel('Data size unit', { exact: true }).click();
  await page
    .getByRole('option', { name: 'GiB (gibibytes)', exact: true })
    .click();
  await page.getByLabel('Transfer rate unit', { exact: true }).click();
  await page
    .getByRole('option', { name: 'MiB/s (mebibytes/second)', exact: true })
    .click();
  await page.getByLabel('Efficiency (%)').fill('');
  await expect(page.getByTestId('transfer-seconds')).toHaveText(
    'Approximately 10.24 seconds'
  );
  await expect(page.getByTestId('transfer-duration')).toHaveText('11 s');
  if (prefix)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/
    );
});

test('rejects bad input without stale output, recovers and resets using keyboard on mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  await page.getByRole('button', { name: 'Load example', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('transfer-seconds')).toHaveText(
    'Approximately 100 seconds'
  );
  for (const value of ['0', '-1', 'NaN', 'Infinity', '1e3', '1,000']) {
    await page.getByLabel('Transfer rate', { exact: true }).fill(value);
    await expect(
      page.getByLabel('Transfer rate', { exact: true })
    ).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.getByRole('region', { name: 'Transfer estimate' })
    ).toHaveCount(0);
  }
  await page.getByLabel('Transfer rate', { exact: true }).fill('100');
  await expect(page.getByTestId('transfer-duration')).toHaveText('1 min 40 s');
  await page.getByLabel('Efficiency (%)').fill('0');
  await expect(
    page.getByRole('region', { name: 'Transfer estimate' })
  ).toHaveCount(0);
  await page.getByLabel('Efficiency (%)').fill('100');
  await page.getByLabel('Data size', { exact: true }).fill('0.001');
  await expect(page.getByTestId('transfer-duration')).toHaveText(
    'Less than 1 s'
  );
  await page.getByLabel('Data size', { exact: true }).fill('0');
  await expect(page.getByTestId('transfer-duration')).toHaveText('0 s');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page
    .getByRole('heading', {
      name: 'Data Transfer Time Calculator',
      exact: true
    })
    .scrollIntoViewIfNeeded();
  await page
    .getByText(
      'Estimate transfer time from a data size and a constant transfer rate. Choose bit or byte units explicitly; this calculator does not measure your connection.',
      { exact: true }
    )
    .locator('..')
    .screenshot({
      path: `output/playwright/transfer-mobile-${test.info().project.name}.png`
    });
  await page
    .getByRole('button', { name: 'Reset calculator', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Transfer estimate' })
  ).toHaveCount(0);
  await expect(page.getByLabel('Data size', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Transfer rate', { exact: true })).toHaveValue(
    ''
  );
});
