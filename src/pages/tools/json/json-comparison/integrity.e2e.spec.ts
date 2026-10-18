import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('comparison UI and actual text download retain string data and compare root types', async ({
  page
}) => {
  await page.goto('/json/json-comparison');
  const inputs = page.locator('#tool input[type=file]');
  const firstInput = inputs.nth(0);
  const secondInput = inputs.nth(1);
  const result = page.getByTestId('text-result');
  const set = async (first: string, second: string) => {
    await firstInput.setInputFiles({
      name: 'first.json',
      mimeType: 'application/json',
      buffer: Buffer.from(first)
    });
    await secondInput.setInputFiles({
      name: 'second.json',
      mimeType: 'application/json',
      buffer: Buffer.from(second)
    });
  };
  await set('{"v":"x,}"}', '{"v":"x}"}');
  await expect(result).toHaveValue('v: Mismatch: x,} != x}');
  const pending = page.waitForEvent('download');
  await page
    .locator('#tool')
    .getByRole('button', { name: 'Download', exact: true })
    .click();
  expect(await readFile((await (await pending).path())!, 'utf8')).toBe(
    'v: Mismatch: x,} != x}'
  );
  for (const [a, b] of [
    ['1', '2'],
    ['null', '{}'],
    ['[]', '{}']
  ]) {
    await set(a, b);
    await expect(result).toHaveValue(`root: Mismatch: ${a} != ${b}`);
  }
  await set('{"a":[1,2,],}', '{"a":[1,2]}');
  await expect(result).toHaveValue('No differences found');
  await set('[,]', '[]');
  await expect(result).toHaveValue(/Invalid JSON format/);
  await set('{"a":{"b":1}}', '{"a":{"b":1}}');
  await expect(result).toHaveValue('No differences found');
});
