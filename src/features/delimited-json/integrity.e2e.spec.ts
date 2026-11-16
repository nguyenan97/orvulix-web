import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const kind of ['csv', 'tsv']) {
  test(`${kind} preserves quoted data in JSON downloads and recovers from strict errors`, async ({
    page
  }) => {
    await page.goto(`/csv/${kind}-to-json`);
    const picker = page.locator('input[type=file]').first();
    const delimiter = kind === 'csv' ? ',' : '\t';
    const source = `name${delimiter}note\r\n"  Alice  "${delimiter}"A ""B""\r\n#literal"`;
    const upload = async (text: string) =>
      picker.setInputFiles({
        name: `data.${kind}`,
        mimeType: 'text/plain',
        buffer: Buffer.from(text)
      });
    await upload(source);
    const result = page.getByTestId('text-result');
    const expected = [{ name: '  Alice  ', note: 'A "B"\r\n#literal' }];
    await expect(result).toHaveValue(JSON.stringify(expected, null, 2));
    const downloadButton = page.getByRole('button', {
      name: 'Download',
      exact: true
    });
    const downloaded = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    expect(
      JSON.parse(await readFile((await download.path())!, 'utf8'))
    ).toEqual(expected);
    await upload(`a${delimiter}b\n1`);
    await expect(
      page.getByRole('alert', { name: 'Delimited input error' })
    ).toContainText('expected 2');
    await expect(result).toHaveValue('');
    await expect(downloadButton).toBeDisabled();
    await upload(`a${delimiter}a\n1${delimiter}2`);
    await expect(
      page.getByRole('alert', { name: 'Delimited input error' })
    ).toContainText('Duplicate headers');
    await upload(`a${delimiter}b\n1${delimiter}2`);
    await expect(result).toHaveValue(JSON.stringify([{ a: 1, b: 2 }], null, 2));
    // Empty import uses the real FileReader path for both textarea and Monaco.
    await upload('');
    await expect(result).toHaveValue('');
    await expect(downloadButton).toBeDisabled();
  });
}
