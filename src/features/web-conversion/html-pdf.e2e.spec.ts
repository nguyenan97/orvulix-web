import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFArray, PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { placement, drawnImage } from './pdf-baseline/assertions';
import { SAMPLE } from './sample';
import { RASTER_FIXTURES } from './assets.fixtures';

async function download(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF', exact: true }).click();
  const result = await pending;
  return {
    name: result.suggestedFilename(),
    bytes: await readFile((await result.path())!)
  };
}
async function rasterize(
  page: Page,
  bytes: Buffer,
  sourcePoints: number[][],
  sourceRects: number[][] = []
) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false }),
    [w, h, x, y] = placement(pdf),
    pageHeight = pdf.getPage(0).getHeight();
  const mapPoint = (point: number[]) => [
    (x + (point[0] * w) / 800) * 2,
    (pageHeight - y - h + (point[1] * h) / 600) * 2
  ];
  const points = [[0, 0], ...sourcePoints.map(mapPoint)];
  const rects = sourceRects.map(([left, top, width, height]) => [
    ...mapPoint([left, top]),
    ((width * w) / 800) * 2,
    ((height * h) / 600) * 2
  ]);
  await page.goto('/pdf/pdf-to-png');
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'raster.pdf',
      mimeType: 'application/pdf',
      buffer: bytes
    });
  const preview = page.locator('img[alt="Preview 0"]');
  await expect(preview).toBeVisible();
  return preview.evaluate(
    async (image, { points, rects }) => {
      const bitmap = await createImageBitmap(
        await (await fetch((image as HTMLImageElement).src)).blob()
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const colors = points.map(([x, y]) => [
        ...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
      ]);
      const ink = rects.map(([x, y, w, h]) => {
        const pixels = ctx.getImageData(
          Math.floor(x),
          Math.floor(y),
          Math.max(1, Math.floor(w)),
          Math.max(1, Math.floor(h))
        ).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4)
          if (pixels[i] < 100 && pixels[i + 1] < 160 && pixels[i + 2] < 160)
            count++;
        return count;
      });
      bitmap.close();
      return { colors, ink };
    },
    { points, rects }
  );
}
for (const [paper, orientation, width, height] of [
  ['A4', 'Portrait', 210, 297],
  ['A4', 'Landscape', 297, 210],
  ['Letter', 'Portrait', 215.9, 279.4],
  ['Letter', 'Landscape', 279.4, 215.9]
] as const) {
  test(`${paper} ${orientation}: upload invoice, page preview and actual PDF pixels/text/table/logo`, async ({
    page
  }) => {
    await page.goto('/pdf/html-to-pdf');
    await page.getByLabel('Paper size', { exact: true }).click();
    await page.getByRole('option', { name: new RegExp(`^${paper}`) }).click();
    // The first real control action waits for lazy route readiness; no arbitrary loading SLA.
    await expect(
      page.getByText(
        /^One-page raster PDF: text is not searchable or selectable/
      )
    ).toBeVisible();
    await page.getByLabel('Page orientation', { exact: true }).click();
    await page.getByRole('option', { name: orientation, exact: true }).click();
    for (const [side, value] of [
      ['Top', '12'],
      ['Right', '20'],
      ['Bottom', '30'],
      ['Left', '5']
    ])
      await page.getByLabel(`${side} margin (mm)`).fill(value);
    await page.getByLabel('Filename', { exact: true }).fill('Nguyễn An.pdf');
    await page
      .getByLabel('Upload HTML file')
      .setInputFiles({
        name: 'invoice.html',
        mimeType: 'text/html',
        buffer: Buffer.from(
          `<!doctype html><html><body>${SAMPLE}</body></html>`
        )
      });
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const frame = page.frameLocator('iframe[title="Sanitized HTML preview"]');
    await expect(frame.getByText('Total: $400')).toBeVisible();
    const regions = await frame.locator('body').evaluate((body) =>
      ['h1', 'td', 'img'].map((selector) => {
        const rect = body.querySelector(selector)!.getBoundingClientRect();
        return [rect.left, rect.top, rect.width, rect.height];
      })
    );
    await page.getByRole('button', { name: 'Convert to PDF' }).click();
    const { name, bytes } = await download(page);
    expect(name).toBe('Nguyễn An.pdf');
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo((width * 72) / 25.4, 1);
    expect(pdf.getPage(0).getHeight()).toBeCloseTo((height * 72) / 25.4, 1);
    const [w, h, x, y] = placement(pdf),
      ratio = 800 / 600;
    const board = await page.locator('[data-pdf-page-preview]').boundingBox();
    const previewBox = await page
      .locator('iframe[title="Sanitized HTML preview"]')
      .boundingBox();
    expect(board!.width).toBeCloseTo(width * 2, 1);
    expect(board!.height).toBeCloseTo(height * 2, 1);
    expect(previewBox!.width).toBeCloseTo(((w * 25.4) / 72) * 2, 1);
    expect(previewBox!.x - board!.x).toBeCloseTo(((x * 25.4) / 72) * 2, 1);
    expect(previewBox!.y - board!.y).toBeCloseTo(
      (((pdf.getPage(0).getHeight() - y - h) * 25.4) / 72) * 2,
      1
    );
    expect(w / h).toBeCloseTo(ratio, 6);
    expect(x).toBeCloseTo(
      (5 * 72) / 25.4 + (pdf.getPage(0).getWidth() - (25 * 72) / 25.4 - w) / 2,
      1
    );
    expect(y).toBeCloseTo(
      (30 * 72) / 25.4 +
        (pdf.getPage(0).getHeight() - (42 * 72) / 25.4 - h) / 2,
      1
    );
    const action = pdf.catalog.lookup(PDFName.of('OpenAction'), PDFArray);
    expect(action.lookup(1, PDFName)).toEqual(PDFName.of('FitH'));
    expect(pdf.catalog.has(PDFName.of('Names'))).toBe(false);
    expect(pdf.getPage(0).node.has(PDFName.of('Annots'))).toBe(false);
    const output = await rasterize(
      page,
      bytes,
      [
        [20, 20],
        [40, 40]
      ],
      regions
    );
    expect(output.colors[0]).toEqual([255, 255, 255, 255]);
    expect(output.colors[1]).toEqual([240, 253, 250, 255]);
    expect(output.colors[2][0]).toBeLessThan(100); // embedded teal logo
    expect(output.ink[0]).toBeGreaterThan(30);
    expect(output.ink[1]).toBeGreaterThan(10);
    expect(output.ink[2]).toBeGreaterThan(30);
  });
}
test('transparent embedded PNG/JPEG, 2x scale and exact-fit HTML keep raster size and paper white', async ({
  page
}) => {
  await page.goto('/pdf/html-to-pdf');
  await page
    .getByLabel('HTML markup')
    .fill(
      `<div style="height:600px"><img src="${RASTER_FIXTURES.png}" width="32" height="32"><img src="${RASTER_FIXTURES.jpeg}" width="32" height="32"><pre style="font-family:monospace">Nguyễn An\ncode</pre></div>`
    );
  await page.getByLabel('Background', { exact: true }).click();
  await page.getByRole('option', { name: 'Transparent' }).click();
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page.getByLabel('Overflow handling', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Stop if content is cropped' })
    .click();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const { bytes } = await download(page);
  const pdf = await PDFDocument.load(bytes);
  expect(
    drawnImage(pdf).dict.lookup(PDFName.of('Width'), PDFNumber).asNumber()
  ).toBe(1600);
  expect(
    drawnImage(pdf).dict.lookup(PDFName.of('Height'), PDFNumber).asNumber()
  ).toBe(1200);
  expect(drawnImage(pdf).dict.has(PDFName.of('SMask'))).toBe(true);
  const output = await rasterize(page, bytes, [
    [10, 10],
    [50, 10],
    [700, 500]
  ]);
  expect(output.colors[1][0]).toBeGreaterThan(240);
  expect(output.colors[1][1]).toBeLessThan(15);
  expect(output.colors[2][0]).toBeGreaterThan(240);
  expect(output.colors[2][1]).toBeLessThan(15);
  expect(output.colors[3]).toEqual([255, 255, 255, 255]);
});
test('strict crossing-row/horizontal boundaries, invalid input/margins and limits recover without stale PDF', async ({
  page
}) => {
  await page.goto('/pdf/html-to-pdf');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(
    page.getByText('Enter HTML or upload an HTML file.')
  ).toBeVisible();
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="height:550px">Header</div><table><tr><td style="height:100px">Crossing row</td></tr></table>'
    );
  await page.getByLabel('Overflow handling', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Stop if content is cropped' })
    .click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/table row\(s\) cross the bottom/)).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/Export stopped/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
  await page.getByLabel('Height (px)').fill('800');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
  await page.getByLabel('Top margin (mm)').fill('-1');
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/finite number from 0 to 100/)).toBeVisible();
  await page.getByLabel('Top margin (mm)').fill('10');
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/exceeds 2 megapixels/)).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page
    .getByLabel('HTML markup')
    .fill('<div style="width:1280px">Wide</div>');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/Content exceeds the image width/)).toBeVisible();
  await page
    .getByLabel('Upload HTML file')
    .setInputFiles({
      name: 'too-large.html',
      mimeType: 'text/html',
      buffer: Buffer.alloc(65537, 97)
    });
  await expect(page.getByText(/at most 64 KiB/)).toBeVisible();
  await page.getByLabel('HTML markup').fill('<p>Recovered</p>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  expect(
    (await PDFDocument.load((await download(page)).bytes)).getPageCount()
  ).toBe(1);
});
test('malicious markup has no external requests/scripts/navigation through preview, capture or PDF', async ({
  page
}) => {
  const leaks: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('blocked.test')) leaks.push(request.url());
  });
  await page.goto('/pdf/html-to-pdf');
  const url = page.url();
  await page
    .getByLabel('HTML markup')
    .fill(
      '<script>parent.__pdfAttack=1</script><meta http-equiv="refresh" content="0;url=https://blocked.test/nav"><base href="https://blocked.test/"><style>@import "https://blocked.test/css";@font-face{font-family:x;src:url(https://blocked.test/font)}</style><svg onload="parent.__pdfAttack=1"></svg><iframe src="https://blocked.test/frame"></iframe><form action="https://blocked.test/post"></form><img src="https://blocked.test/img" srcset="https://blocked.test/2x 2x"><p onclick="parent.__pdfAttack=1" style="background-image:url(https://blocked.test/bg);break-inside:avoid">Safe Nguyễn An</p>'
    );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title="Sanitized HTML preview"]')
      .getByText('Safe Nguyễn An')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const { bytes } = await download(page);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  expect(
    await page.evaluate(() => Reflect.get(window, '__pdfAttack'))
  ).toBeUndefined();
  expect(page.url()).toBe(url);
  expect(leaks).toEqual([]);
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
});
test('native unavailable/stalled decode, mobile/dark/keyboard, edits/cancel/reset and navigation recover', async ({
  page
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/pdf/html-to-pdf');
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(391);
  await page.evaluate(() => {
    Reflect.set(window, '__bitmap', createImageBitmap);
    Reflect.set(window, 'createImageBitmap', undefined);
  });
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/cannot safely decode/)).toBeVisible();
  await page.evaluate(() => {
    Reflect.set(window, 'createImageBitmap', () => new Promise(() => {}));
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/decoding timed out/)).toBeVisible({
    timeout: 8000
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.getByLabel('Left margin (mm)').fill('20');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText(/Conversion cancelled/)).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.locator('a[href="/"]').first().click(); // Client routing exercises component unmount, not a full reload.
  await expect(page).toHaveURL('http://localhost:4173/');
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
  await page.goBack();
  await expect(page.getByLabel('HTML markup')).toBeVisible();
  await page.evaluate(() =>
    Reflect.set(window, 'createImageBitmap', Reflect.get(window, '__bitmap'))
  );
  await page.getByLabel('HTML markup').fill('<p>Recovered</p>');
  await page.getByLabel('HTML markup').press('Control+Enter');
  await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
});
