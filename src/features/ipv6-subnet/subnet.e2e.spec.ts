import { expect, test } from '@playwright/test';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const path = `${prefix}/number/ipv6-subnet-calculator`;

test('normalizes IPv6 and gives CIDR explicit ownership without stale results', async ({
  page
}) => {
  const external: string[] = [];
  // Existing app icons are asset downloads, not calculator input traffic.
  const icons: Record<string, string[]> = {
    '/ic.json': ['round-contrast'],
    '/mdi.json': [
      'bookmark-plus-outline',
      'bridge',
      'dice-multiple',
      'ip-network-outline',
      'network',
      'ohm',
      'timer-outline',
      'arrow-up'
    ],
    '/material-symbols.json': ['add', 'add-circle', 'functions'],
    '/fluent.json': [
      'calculator-arrow-clockwise-24-regular',
      'text-number-format-24-regular'
    ],
    '/simple-icons.json': ['wire'],
    '/ph.json': ['sphere-duotone'],
    '/gravity-ui.json': ['sphere']
  };
  page.on('request', (request) => {
    const url = new URL(request.url());
    const knownIconAsset =
      url.origin === 'https://api.iconify.design' &&
      request.method() === 'GET' &&
      request.postData() === null &&
      [...url.searchParams.keys()].join(',') === 'icons' &&
      (url.searchParams.get('icons') ?? '')
        .split(',')
        .every((icon) => icons[url.pathname]?.includes(icon));
    if (
      !request.url().startsWith('http://localhost:') &&
      !request.url().startsWith('data:') &&
      !knownIconAsset
    )
      external.push(request.url());
  });
  await page.goto(path);
  await expect(
    page.getByRole('heading', { name: 'IPv6 Subnet Calculator', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Load example', exact: true }).click();
  await expect(page.getByTestId('ipv6-network-cidr')).toHaveText(
    '2001:db8:abcd:1234::/64'
  );
  await expect(page.getByTestId('ipv6-total-addresses')).toHaveText(
    '18446744073709551616'
  );
  await page.getByLabel('IPv6 prefix length', { exact: true }).fill('/48');
  await page
    .getByLabel('IPv6 address or CIDR', { exact: true })
    .fill('2001:DB8:abcd:1234::1/64');
  await expect(
    page.getByLabel('IPv6 prefix length', { exact: true })
  ).toBeDisabled();
  await page
    .getByLabel('IPv6 address or CIDR', { exact: true })
    .fill('2001:db8:abcd:1234::1');
  await expect(
    page.getByLabel('IPv6 prefix length', { exact: true })
  ).toHaveValue('/48');
  await expect(page.getByTestId('ipv6-network-cidr')).toHaveText(
    '2001:db8:abcd::/48'
  );
  await page.getByLabel('IPv6 address or CIDR', { exact: true }).fill('::1::');
  await expect(
    page.getByRole('region', { name: 'IPv6 subnet results' })
  ).toHaveCount(0);
  await page
    .getByLabel('IPv6 address or CIDR', { exact: true })
    .fill('::ffff:192.0.2.128/128');
  await expect(page.getByTestId('ipv6-normalized-address')).toHaveText(
    '::ffff:c000:280'
  );
  await expect(page.getByTestId('ipv6-total-addresses')).toHaveText('1');
  expect(external).toEqual([]);
  if (prefix)
    await expect(page.locator('meta[name=robots]')).toHaveAttribute(
      'content',
      /noindex/
    );
});

test('calculates new input offline after the application loads', async ({
  page,
  context
}) => {
  await page.goto(path);
  const address = page.getByLabel('IPv6 address or CIDR', { exact: true });
  await expect(address).toBeVisible();
  await context.setOffline(true);
  await address.fill('2001:db8:abcd:1234:ffff::1/65');
  await expect(page.getByTestId('ipv6-first-address')).toHaveText(
    '2001:db8:abcd:1234:8000::'
  );
  await expect(page.getByTestId('ipv6-total-addresses')).toHaveText(
    '9223372036854775808'
  );
  await address.fill('bad input');
  await expect(
    page.getByRole('region', { name: 'IPv6 subnet results' })
  ).toHaveCount(0);
  await address.fill('::1/128');
  await expect(page.getByTestId('ipv6-total-addresses')).toHaveText('1');
});

test('handles /0, /127 and /128 exactly and resets with the keyboard on mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  const address = page.getByLabel('IPv6 address or CIDR', { exact: true });
  await address.fill('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/0');
  await expect(page.getByTestId('ipv6-total-addresses')).toHaveText(
    '340282366920938463463374607431768211456'
  );
  await expect(page.getByTestId('ipv6-first-address')).toHaveText('::');
  await expect(page.getByTestId('ipv6-last-address')).toHaveText(
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page
    .getByRole('region', { name: 'IPv6 subnet results' })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `output/playwright/ipv6-mobile-${test.info().project.name}.png`,
    fullPage: false
  });
  await address.fill('2001:db8::b/127');
  await expect(page.getByTestId('ipv6-first-address')).toHaveText(
    '2001:db8::a'
  );
  await expect(page.getByTestId('ipv6-total-addresses')).toHaveText('2');
  await address.fill('2001:db8::b/128');
  await expect(page.getByTestId('ipv6-first-address')).toHaveText(
    '2001:db8::b'
  );
  await expect(page.getByTestId('ipv6-last-address')).toHaveText('2001:db8::b');
  const reset = page.getByRole('button', {
    name: 'Reset calculator',
    exact: true
  });
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(address).toHaveValue('');
  await expect(
    page.getByRole('region', { name: 'IPv6 subnet results' })
  ).toHaveCount(0);
});

test('rejects invalid prefixes and endpoint syntax, then recovers without script execution', async ({
  page
}) => {
  const dialogs: string[] = [];
  const errors: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(path);
  const address = page.getByLabel('IPv6 address or CIDR', { exact: true });
  const manual = page.getByLabel('IPv6 prefix length', { exact: true });
  await address.fill('::1');
  await manual.fill('129');
  await expect(manual).toHaveAttribute('aria-invalid', 'true');
  await expect(
    page.getByRole('region', { name: 'IPv6 subnet results' })
  ).toHaveCount(0);
  for (const invalid of [
    'fe80::1%eth0',
    '[::1]:80',
    '::ffff:999.0.0.1',
    '<img src=x onerror=alert(1)>'
  ]) {
    await address.fill(invalid);
    await expect(address).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.getByRole('region', { name: 'IPv6 subnet results' })
    ).toHaveCount(0);
  }
  await address.fill('2001:db8::1/33');
  await expect(page.getByTestId('ipv6-network-cidr')).toHaveText(
    '2001:db8::/33'
  );
  await address.fill('');
  await expect(
    page.getByRole('region', { name: 'IPv6 subnet results' })
  ).toHaveCount(0);
  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
});
