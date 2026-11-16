import { expect, test } from '@playwright/test';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const path = `${prefix}/number/ipv4-subnet-calculator`;
test('calculates from dotted masks and gives CIDR explicit ownership', async ({
  page
}) => {
  await page.goto(path);
  await page.getByRole('button', { name: 'Load example', exact: true }).click();
  await expect(page.getByTestId('subnet-network-cidr')).toHaveText(
    '192.168.1.0/24'
  );
  await expect(page.getByTestId('subnet-directed-broadcast')).toHaveText(
    '192.168.1.255'
  );
  await expect(page.getByTestId('subnet-host-range')).toHaveText(
    '192.168.1.1 to 192.168.1.254'
  );
  await page.getByLabel('Prefix length or subnet mask').fill('255.255.255.128');
  await expect(page.getByTestId('subnet-network-cidr')).toHaveText(
    '192.168.1.128/25'
  );
  await expect(page.getByTestId('subnet-host-slots')).toHaveText('126');
  await page.getByLabel('IPv4 address or CIDR').fill('192.0.2.11/31');
  await expect(page.getByLabel('Prefix length or subnet mask')).toBeDisabled();
  await expect(page.getByLabel('Prefix length or subnet mask')).toHaveValue(
    '31'
  );
  await expect(page.getByTestId('subnet-host-range')).toHaveText(
    '192.0.2.10 to 192.0.2.11'
  );
  await expect(page.getByTestId('subnet-directed-broadcast')).toHaveText(
    'Not used for /31 point-to-point links'
  );
  await page.getByLabel('IPv4 address or CIDR').fill('192.0.2.11');
  await expect(page.getByLabel('Prefix length or subnet mask')).toBeEnabled();
  await expect(page.getByLabel('Prefix length or subnet mask')).toHaveValue(
    '255.255.255.128'
  );
  await expect(page.getByTestId('subnet-network-cidr')).toHaveText(
    '192.0.2.0/25'
  );
  if (prefix)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/
    );
});

test('handles /0, high /31 and /32 without signed overflow or enumeration', async ({
  page
}) => {
  await page.goto(path);
  const address = page.getByLabel('IPv4 address or CIDR');
  await address.fill('255.255.255.255/0');
  await expect(page.getByTestId('subnet-network-cidr')).toHaveText('0.0.0.0/0');
  await expect(page.getByTestId('subnet-total-addresses')).toHaveText(
    '4,294,967,296'
  );
  await expect(page.getByTestId('subnet-host-slots')).toHaveText(
    '4,294,967,294'
  );
  await address.fill('255.255.255.255/31');
  await expect(page.getByTestId('subnet-network-address')).toHaveText(
    '255.255.255.254'
  );
  await expect(page.getByTestId('subnet-host-slots')).toHaveText('2');
  await address.fill('255.255.255.255/32');
  await expect(page.getByTestId('subnet-host-range')).toHaveText(
    '255.255.255.255 to 255.255.255.255'
  );
  await expect(page.getByTestId('subnet-host-slots')).toHaveText('1');
  await expect(
    page.getByText('/32 describes one host route.', { exact: false })
  ).toBeVisible();
});

test('clears stale results on invalid input and supports keyboard/reset on mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  await page.getByRole('button', { name: 'Load example', exact: true }).focus();
  await page.keyboard.press('Enter');
  for (const value of [
    '256.0.0.1',
    '01.2.3.4',
    '::1',
    '192.0.2.1/33',
    '192.0.2.1/'
  ]) {
    await page.getByLabel('IPv4 address or CIDR').fill(value);
    await expect(
      page.getByRole('region', { name: 'Subnet results' })
    ).toHaveCount(0);
    await expect(page.getByLabel('IPv4 address or CIDR')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  }
  await page.getByLabel('IPv4 address or CIDR').fill('192.168.1.130');
  await page.getByLabel('Prefix length or subnet mask').fill('255.0.255.0');
  await expect(
    page.getByRole('region', { name: 'Subnet results' })
  ).toHaveCount(0);
  await expect(page.getByLabel('Prefix length or subnet mask')).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  await page.getByLabel('Prefix length or subnet mask').fill('/24');
  await expect(page.getByTestId('subnet-network-cidr')).toHaveText(
    '192.168.1.0/24'
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page
    .getByText(
      'Calculate IPv4 subnet boundaries from an address and prefix or mask. Paste CIDR directly, or enter an address and use the separate subnet field. This tool performs arithmetic without DNS or network probes.',
      { exact: true }
    )
    .locator('..')
    .screenshot({
      path: `output/playwright/subnet-mobile-${test.info().project.name}.png`
    });
  await page
    .getByRole('button', { name: 'Reset calculator', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Subnet results' })
  ).toHaveCount(0);
  await expect(page.getByLabel('IPv4 address or CIDR')).toHaveValue('');
});
