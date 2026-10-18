import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { placement, drawnImage } from './pdf-baseline/assertions';
import { RASTER_FIXTURES } from './assets.fixtures';
const colors = ['red', 'green', 'blue', 'yellow'];
const rgba = [
  [255, 0, 0, 255],
  [0, 128, 0, 255],
  [0, 0, 255, 255],
  [255, 255, 0, 255]
];
const fixture = colors
  .map(
    (color, i) =>
      `<div style="height:400px;background-color:${color}">Source ${
        i + 1
      } Nguyễn An ${
        i === 0
          ? `<img src="${RASTER_FIXTURES.png}" width="16" height="16"><img src="${RASTER_FIXTURES.jpeg}" width="16" height="16">`
          : ''
      }</div>`
  )
  .join('');
async function setup(page: Page, landscape = false) {
  await page.goto('/pdf/html-to-pdf');
  await page.getByLabel('PDF layout', { exact: true }).click();
  await page.getByRole('option', { name: 'Paginated', exact: true }).click();
  await page.getByLabel('Width (px)').fill(landscape ? '800' : '320');
  if (landscape) {
    await page.getByLabel('Paper size', { exact: true }).click();
    await page.getByRole('option', { name: /^Letter/ }).click();
    await page.getByLabel('Page orientation', { exact: true }).click();
    await page.getByRole('option', { name: 'Landscape', exact: true }).click();
    await page.getByLabel('Scale', { exact: true }).click();
    await page.getByRole('option', { name: '2x' }).click();
    await page.getByLabel('Left margin (mm)').fill('5');
    await page.getByLabel('Right margin (mm)').fill('20');
    await page.getByLabel('Top margin (mm)').fill('12');
    await page.getByLabel('Bottom margin (mm)').fill('30');
  }
}
async function custom(page: Page, expression: string) {
  await page.getByLabel('Pages to export', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Custom ranges', exact: true })
    .click();
  await page.getByLabel('Page ranges', { exact: true }).fill(expression);
}
async function download(page: Page) {
  await expect(
    page.getByRole('link', { name: 'Download PDF', exact: true })
  ).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF', exact: true }).click();
  const result = await pending;
  return {
    bytes: await readFile((await result.path())!),
    name: result.suggestedFilename()
  };
}
async function verifyPixels(
  page: Page,
  bytes: Buffer,
  expected: number[],
  width: number
) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const points = expected.map((_, i) => {
    const [w, h, x, y] = placement(pdf, i);
    return [
      (x + w * 0.8) * 2,
      (pdf.getPage(i).getHeight() - y - h + h / 2) * 2
    ];
  });
  await page.goto('/pdf/pdf-to-png');
  await page.locator('input[type=file]').setInputFiles({
    name: 'selected.pdf',
    mimeType: 'application/pdf',
    buffer: bytes
  });
  for (const [i, source] of expected.entries()) {
    const image = page.locator(`img[alt="Preview ${i}"]`);
    await expect(image).toBeVisible();
    const pixel = await image.evaluate(async (image, point) => {
      const bitmap = await createImageBitmap(
        await (await fetch((image as HTMLImageElement).src)).blob()
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const color = [
        ...ctx.getImageData(Math.floor(point[0]), Math.floor(point[1]), 1, 1)
          .data
      ];
      bitmap.close();
      canvas.width = canvas.height = 0;
      return color;
    }, points[i]);
    expect(pixel).toEqual(rgba[source - 1]);
    expect(placement(pdf, i)[0] / placement(pdf, i)[1]).toBeCloseTo(
      width / 400,
      6
    );
  }
}
for (const [expression, expected, landscape] of [
  ['2', [2], false],
  ['1,3', [1, 3], false],
  ['2-4', [2, 3, 4], true],
  ['4,2,2-3', [2, 3, 4], false],
  ['all', [1, 2, 3, 4], false]
] as const)
  test(`${expression}: full source preview, normalized selection and actual PDF pixels/geometry`, async ({
    page
  }) => {
    await setup(page, landscape);
    await page.getByLabel('Upload HTML file').setInputFiles({
      name: 'invoice.html',
      mimeType: 'text/html',
      buffer: Buffer.from(fixture)
    });
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByText(/^4 pages -/)).toBeVisible();
    if (expression !== 'all') {
      await custom(page, expression);
      await expect(
        page.getByRole('link', { name: 'Download PDF' })
      ).toHaveCount(0);
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
    }
    await expect(
      page.getByText(
        `Selected source pages: ${expected.join(', ')} - ${
          expected.length
        } PDF pages to export.`,
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      page.locator('iframe[title^="Paginated preview"]')
    ).toHaveCount(expected.length);
    await page.getByLabel('Filename', { exact: true }).fill('Nguyễn An.pdf');
    await page.getByRole('button', { name: 'Convert to PDF' }).click();
    const { bytes, name } = await download(page);
    expect(name).toBe('Nguyễn An.pdf');
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(pdf.getPageCount()).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(
        drawnImage(pdf, i)
          .dict.lookup(PDFName.of('Height'), PDFNumber)
          .asNumber()
      ).toBe(landscape ? 800 : 400);
      expect(pdf.getPage(i).getWidth()).toBeCloseTo(
        ((landscape ? 279.4 : 210) * 72) / 25.4,
        1
      );
      expect(pdf.getPage(i).getHeight()).toBeCloseTo(
        ((landscape ? 215.9 : 297) * 72) / 25.4,
        1
      );
      const [, , x, y] = placement(pdf, i);
      expect(x).toBeCloseTo(((landscape ? 5 : 10) * 72) / 25.4, 1);
      expect(pdf.getPage(i).getHeight() - y - placement(pdf, i)[1]).toBeCloseTo(
        ((landscape ? 12 : 10) * 72) / 25.4,
        1
      );
    }
    await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
    await verifyPixels(page, bytes, [...expected], landscape ? 800 : 320);
  });
test('invalid syntax/bounds, full-document limits, One page isolation and recovery', async ({
  page
}) => {
  await setup(page);
  await page.getByLabel('HTML markup').fill(fixture);
  await custom(page, '');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/Enter custom page ranges/)).toBeVisible();
  await page
    .getByLabel('Page ranges', { exact: true })
    .fill('1' + ' '.repeat(127) + ',8');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/at most 128 UTF-8 bytes/)).toBeVisible();
  for (const [expression, message] of [
    ['1,,2', /Invalid page range/],
    ['5', /outside the 4-page/],
    ['0', /Page numbers must/],
    ['4-2', /Page numbers must/]
  ] as const) {
    await page.getByLabel('Page ranges', { exact: true }).fill(expression);
    await page.getByRole('button', { name: 'Convert to PDF' }).click();
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(
      0
    );
    await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  }
  await page.getByLabel('Page ranges', { exact: true }).fill('1');
  await page
    .getByLabel('HTML markup')
    .fill(
      Array(10).fill('<div style="height:400px">Too many pages</div>').join('')
    );
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/Document exceeds 8 PDF pages/)).toBeVisible();
  await page.getByLabel('HTML markup').fill(fixture);
  await page.getByLabel('Page ranges', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  expect(
    (await PDFDocument.load((await download(page)).bytes)).getPageCount()
  ).toBe(1);
  await page.getByLabel('PDF layout', { exact: true }).click();
  await page.getByRole('option', { name: 'One page', exact: true }).click();
  await expect(page.getByLabel('Pages to export')).toHaveCount(0);
  await page.getByLabel('HTML markup').fill('<p>One page unchanged</p>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  expect(
    (await PDFDocument.load((await download(page)).bytes)).getPageCount()
  ).toBe(1);
});
test('range edits during selected capture cancel old job; mobile/dark/keyboard, security and SPA recovery', async ({
  page
}) => {
  const leaks: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('blocked.test')) leaks.push(r.url());
  });
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page
    .getByLabel('HTML markup')
    .fill(
      '<script>parent.__rangeAttack=1</script><style>@import "https://blocked.test/css"</style><img src="https://blocked.test/image">' +
        fixture
    );
  await custom(page, '1,3');
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    Reflect.set(window, '__toBlob', original);
    let count = 0;
    HTMLCanvasElement.prototype.toBlob = function (cb, type, q) {
      if (++count === 2) {
        Reflect.set(window, '__held', this);
        Reflect.set(window, '__release', () =>
          original.call(this, cb, type, q)
        );
      } else original.call(this, cb, type, q);
    };
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect
    .poll(() => page.evaluate(() => !!Reflect.get(window, '__held')))
    .toBe(true);
  await expect(page.getByRole('status')).toHaveText(
    'Capturing source page 3 - output page 2 of 2'
  );
  await page.getByLabel('Page ranges', { exact: true }).fill('2');
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page.evaluate(() => {
    Reflect.set(
      HTMLCanvasElement.prototype,
      'toBlob',
      Reflect.get(window, '__toBlob')
    );
    Reflect.get(window, '__release')();
  });
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__held').width))
    .toBe(0);
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  await page.getByLabel('HTML markup').press('Control+Enter');
  const { bytes } = await download(page);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  expect(leaks).toEqual([]);
  expect(
    await page.evaluate(() => Reflect.get(window, '__rangeAttack'))
  ).toBeUndefined();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(391);
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.evaluate(() => {
    Reflect.set(window, '__bitmap', createImageBitmap);
    Reflect.set(window, 'createImageBitmap', () => new Promise(() => {}));
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL('http://localhost:4173/');
  await expect(page.getByLabel('HTML markup')).toHaveCount(0);
  await page.goBack();
  await expect(page.getByLabel('HTML markup')).toBeVisible();
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page.evaluate(() =>
    Reflect.set(window, 'createImageBitmap', Reflect.get(window, '__bitmap'))
  );
  await page.getByLabel('HTML markup').fill('<p>Recovered</p>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await download(page);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
});
