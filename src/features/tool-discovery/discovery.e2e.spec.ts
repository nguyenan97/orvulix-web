import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import {
  drawnImage,
  placement
} from '../web-conversion/pdf-baseline/assertions';

test('homepage recommends stable tools, category browse keeps HTML last, search still opens it by keyboard', async ({
  page
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Try.*Split PDF/i })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Try.*Resize image/i })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Try.*HTML/i })).toHaveCount(0);
  await page.getByRole('button', { name: /Try.*Split PDF/i }).click();
  await expect(page).toHaveURL(/\/pdf\/split-pdf$/);
  for (const [category, path] of [
    ['pdf', 'pdf/html-to-pdf'],
    ['image-generic', 'image-generic/html-to-image']
  ]) {
    await page.goto(`/categories/${category}`);
    const links = page.locator(`a[href^="/${category}/"]`);
    await expect(links.last()).toHaveAttribute('href', `/${path}`);
    await expect(links.last()).toBeVisible();
  }
  await page.goto('/');
  const search = page.locator('input[role=combobox]');
  await search.fill('HTML to PDF');
  await expect(
    page.getByRole('option').filter({ hasText: 'HTML to PDF' })
  ).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(/\/pdf\/html-to-pdf$/);
  await expect(
    page.getByText(/Experimental local HTML conversion/)
  ).toBeVisible();
  await expect(page.getByText(/Upload a local .html file/)).toBeVisible();
});

test('mobile dark local-file workflow keeps sample/upload/preview and actual PNG/PDF exports', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  const html =
    '<div style="width:200px;height:100px;background-color:#ff0000">Local file</div>';
  for (const pdf of [false, true]) {
    await page.goto(pdf ? '/pdf/html-to-pdf' : '/image-generic/html-to-image');
    await expect(
      page.getByText(/Experimental local HTML conversion/)
    ).toBeVisible();
    await expect(page.locator('input[type=url]')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Load example', exact: true })
      .click();
    await expect(page.getByLabel('HTML markup')).not.toHaveValue('');
    await page.getByLabel('Upload HTML file').setInputFiles({
      name: 'local.html',
      mimeType: 'text/html',
      buffer: Buffer.from(html)
    });
    await expect(page.getByLabel('HTML markup')).toHaveValue(html);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(
      page.locator('iframe[title="Sanitized HTML preview"]')
    ).toBeVisible();
    const convert = page.getByRole('button', {
      name: pdf ? 'Convert to PDF' : 'Convert to image',
      exact: true
    });
    await convert.focus();
    await page.keyboard.press('Enter');
    const link = page.getByRole('link', {
      name: pdf ? 'Download PDF' : 'Download PNG',
      exact: true
    });
    await expect(link).toBeVisible();
    const pending = page.waitForEvent('download');
    await link.click();
    const bytes = await readFile((await (await pending).path())!);
    let x = 50,
      y = 50;
    if (pdf) {
      const document = await PDFDocument.load(bytes, { updateMetadata: false });
      expect(document.getPageCount()).toBe(1);
      expect(drawnImage(document)).toBeDefined();
      const [w, h, left, bottom] = placement(document);
      x = (left + (w * 50) / 800) * 2;
      y = (document.getPage(0).getHeight() - bottom - h + (h * 50) / 600) * 2;
      await page.goto('/pdf/pdf-to-png');
      await page.locator('input[type=file]').setInputFiles({
        name: 'local.pdf',
        mimeType: 'application/pdf',
        buffer: bytes
      });
      await expect(page.locator('img[alt="Preview 0"]')).toBeVisible();
    }
    const color = await page.evaluate(
      async ({ base64, pdf, x, y }) => {
        const image = new Image();
        image.src = pdf
          ? document.querySelector<HTMLImageElement>('img[alt="Preview 0"]')!
              .src
          : `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return [
          ...context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
        ];
      },
      { base64: bytes.toString('base64'), pdf, x, y }
    );
    expect(color).toEqual([255, 0, 0, 255]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  }
});
