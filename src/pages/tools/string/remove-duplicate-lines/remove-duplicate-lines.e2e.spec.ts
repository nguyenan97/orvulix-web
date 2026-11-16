import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { nativeClipboardText } from '../../../../features/text-result-clipboard/testing/native-text';

const prefix = process.env.COPY_TEST_PREFIX ?? '';

test('preserve, trim and sort keep exact current output through copy and download', async ({
  page,
  context,
  browserName
}) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    Object.assign(window, { duplicateLineCopies: [] as string[] });
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: async (value: string) => {
        await original(value);
        (
          window as unknown as { duplicateLineCopies: string[] }
        ).duplicateLineCopies.push(value);
      }
    });
  });
  await page.goto(`${prefix}/string/remove-duplicate-lines`);
  const input = page.getByTestId('text-input');
  const result = page.getByTestId('text-result');
  const liveText = (text: string) =>
    page.getByText(text, { exact: true }).first();
  await input.fill(' b \na\n\nb\n  \na\nc\nc\n');
  await expect(result).toHaveValue(' b \na\n\nb\n  \nc');
  await liveText('Preserve All Newlines').click();
  await expect(result).toHaveValue(' b \na\n\nb\n  \nc\n');
  await page
    .getByRole('checkbox', { name: 'Trim Text Lines', exact: true })
    .first()
    .check();
  await expect(result).toHaveValue('b\na\n\n\nc\n');
  await page
    .getByRole('checkbox', { name: 'Sort the Output Lines', exact: true })
    .first()
    .check();
  const expected = '\n\n\na\nb\nc';
  await expect(result).toHaveValue(expected);
  await page
    .getByRole('button', { name: 'Copy to clipboard', exact: true })
    .last()
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { duplicateLineCopies: string[] })
            .duplicateLineCopies
      )
    )
    .toEqual([expected]);
  if (browserName === 'chromium')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      nativeClipboardText(expected)
    );
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.txt$/);
  expect(await readFile((await download.path())!, 'utf8')).toBe(expected);
  await input.fill('');
  await expect(result).toHaveValue('');
  await input.fill('Tiếng Việt 😀\nTiếng Việt 😀');
  await expect(result).toHaveValue('Tiếng Việt 😀');
});

test('mode and blank-line policy changes recompute from source rather than prior output', async ({
  page
}) => {
  await page.goto(`${prefix}/string/remove-duplicate-lines`);
  const result = page.getByTestId('text-result');
  const option = (text: string) =>
    page.getByText(text, { exact: true }).first();
  await page.getByTestId('text-input').fill('b\nb\n\nb\na\na\n\n');
  await expect(result).toHaveValue('b\n\na');
  await option('Preserve All Newlines').click();
  await expect(result).toHaveValue('b\n\na\n\n');
  await option('Remove Consecutive Duplicate Lines').click();
  await expect(result).toHaveValue('b\n\nb\na\n\n');
  await option('Leave Absolutely Unique Text Lines').click();
  await expect(result).toHaveValue('\n\n');
  await option('Filter All Newlines').click();
  await expect(result).toHaveValue('');
  await option('Delete All Newlines').click();
  await option('Remove Consecutive Duplicate Lines').click();
  await expect(result).toHaveValue('b\na');
  await option('Preserve All Newlines').click();
  await expect(result).toHaveValue('b\n\nb\na\n\n');
});
