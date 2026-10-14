import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('XML upload, Unicode/attributes, real download and malformed-input recovery', async ({
  page
}) => {
  await page.goto('/xml/xml-beautifier');
  const source = '<invoice owner="Nguyễn An"><total>42</total></invoice>';
  await page.locator('input[type=file]').setInputFiles({
    name: 'invoice.xml',
    mimeType: 'application/xml',
    buffer: Buffer.from(source)
  });
  const result = page.getByTestId('text-result');
  await expect(result).toHaveValue(/owner="Nguyễn An"/);
  await expect(result).toHaveValue(/\n\s+<total>42<\/total>/);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!);
  expect(bytes.toString('utf8')).toContain('owner="Nguyễn An"');
  expect(bytes.toString('utf8')).toContain('<total>42</total>');
  await page.getByTestId('text-input').fill('<root><item></root>');
  await expect(result).toHaveValue(/^Invalid XML:/);
  await page.getByTestId('text-input').fill('<root>Recovered</root>');
  await expect(result).toHaveValue('<root>Recovered</root>\n');
});

test('XML entities stay bounded, external entities make no requests and output cannot execute markup', async ({
  page
}) => {
  const leaks: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('blocked.security.test'))
      leaks.push(request.url());
  });
  await page.goto('/xml/xml-beautifier');
  const input = page.getByTestId('text-input'),
    result = page.getByTestId('text-result');
  const entities = ['<!ENTITY a "1234567890">'];
  for (let i = 1; i <= 12; i++)
    entities.push(
      `<!ENTITY ${String.fromCharCode(97 + i)} "${`&${String.fromCharCode(
        96 + i
      )};`.repeat(10)}">`
    );
  await input.fill(`<!DOCTYPE root [${entities.join('')}]><root>&m;</root>`);
  await expect(result).toHaveValue('<root>&amp;m;</root>\n');
  await input.fill(
    '<!DOCTYPE root [<!ENTITY external SYSTEM "https://blocked.security.test/private">]><root>&external;</root>'
  );
  await expect(result).toHaveValue('<root>&amp;external;</root>\n');
  await input.fill('<root>&#9999999999999999;</root>');
  await expect(result).toHaveValue('<root>&amp;#9999999999999999;</root>\n');
  await input.fill(
    '<root><script>window.__xmlSecurityAttack=1</script><img src="https://blocked.security.test/image"/></root>'
  );
  await expect(result).toHaveValue(/window.__xmlSecurityAttack=1/);
  expect(
    await page.evaluate(() => Reflect.get(window, '__xmlSecurityAttack'))
  ).toBeUndefined();
  expect(leaks).toEqual([]);
  await input.fill('<root>Recovery after hostile XML</root>');
  await expect(result).toHaveValue('<root>Recovery after hostile XML</root>\n');
});

test('patched router keeps internal tool navigation and XML validator recovery', async ({
  page
}) => {
  await page.goto('/xml/xml-validator');
  const input = page.getByTestId('text-input'),
    result = page.getByTestId('text-result');
  await input.fill('<root><item>Valid</item></root>');
  await expect(result).toHaveValue('Valid XML');
  await input.fill('<root><item></root>');
  await expect(result).toHaveValue(/^Invalid XML:/);
  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL('http://localhost:4173/');
  await page.goBack();
  await expect(input).toBeVisible();
  await input.fill('<root>After navigation</root>');
  await expect(result).toHaveValue('Valid XML');
});
