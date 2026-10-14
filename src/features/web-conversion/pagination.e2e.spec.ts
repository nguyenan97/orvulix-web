import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { drawnImage, placement } from './pdf-baseline/assertions';
import { RASTER_FIXTURES } from './assets.fixtures';
async function mode(page: Page) {
  await page.goto('/pdf/html-to-pdf');
  await page.getByLabel('PDF layout', { exact: true }).click();
  await page.getByRole('option', { name: 'Paginated', exact: true }).click();
}
async function download(page: Page) {
  // A bounded conversion may take longer than an assertion's visibility poll.
  // Observe the real job completion within the unchanged whole-test deadline.
  await page.waitForFunction(() =>
    [...document.querySelectorAll('button')].some(
      (button) => button.textContent === 'Convert to PDF' && !button.disabled
    )
  );
  await expect(
    page.getByRole('link', { name: 'Download PDF', exact: true })
  ).toBeVisible();
  const event = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF', exact: true }).click();
  const result = await event;
  return readFile((await result.path())!);
}
async function pixels(page: Page, bytes: Buffer, locations: number[][][]) {
  await page.goto('/pdf/pdf-to-png');
  await page.locator('input[type=file]').setInputFiles({
    name: 'multi.pdf',
    mimeType: 'application/pdf',
    buffer: bytes
  });
  const result: number[][][] = [];
  for (const [index, points] of locations.entries()) {
    const image = page.locator(`img[alt="Preview ${index}"]`);
    await expect(image).toBeVisible();
    result.push(
      await image.evaluate(async (node, points) => {
        const bitmap = await createImageBitmap(
          await (await fetch((node as HTMLImageElement).src)).blob()
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const colors = points.map(([x, y]) => [
          ...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
        ]);
        bitmap.close();
        canvas.width = canvas.height = 0;
        return colors;
      }, points)
    );
  }
  return result;
}
for (const [paper, orientation, scale] of [
  ['A4', 'Portrait', '1x'],
  ['Letter', 'Landscape', '2x']
] as const) {
  test(`${paper}/${orientation}/${scale}: long invoice rows, preview, PDF bytes and every row's actual pixels in order`, async ({
    page
  }) => {
    await mode(page);
    await page.getByLabel('Paper size', { exact: true }).click();
    await page.getByRole('option', { name: new RegExp(`^${paper}`) }).click();
    await page.getByLabel('Page orientation', { exact: true }).click();
    await page.getByRole('option', { name: orientation, exact: true }).click();
    await page.getByLabel('Scale', { exact: true }).click();
    await page.getByRole('option', { name: scale, exact: true }).click();
    await page.getByLabel('Top margin (mm)').fill('12');
    await page.getByLabel('Left margin (mm)').fill('5');
    const colors = Array.from({ length: 24 }, (_, i) => [
      40 + i * 7,
      210 - i * 5,
      80 + i * 3
    ]);
    const markup =
      '<h1 style="height:40px;margin:0;font-size:24px">Hóa đơn Nguyễn An</h1><ul style="margin:0"><li style="height:40px">Invoice items</li></ul><pre style="height:40px;margin:0">const total = 24;</pre><table style="width:100%">' +
      colors
        .map(
          (color, i) =>
            `<tr><td style="height:60px;padding:0;border:0px solid black;background-color:rgb(${color.join(
              ','
            )})">Row ${i} Nguyễn An ${
              i === 0
                ? `<img src="${RASTER_FIXTURES.png}" width="16" height="16"><img src="${RASTER_FIXTURES.jpeg}" width="16" height="16">`
                : ''
            }</td></tr>`
        )
        .join('') +
      '</table>';
    await page.getByLabel('Upload HTML file').setInputFiles({
      name: 'invoice.html',
      mimeType: 'text/html',
      buffer: Buffer.from(markup)
    });
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByText(/pages - same source bounds/)).toBeVisible();
    const frames = page.locator('iframe[title^="Paginated preview"]');
    const bounds = await page.getByText(/^Page \d+ - source/).allTextContents();
    const slices = bounds.map((t) =>
      t
        .match(/source (\d+)\.\.(\d+)/)!
        .slice(1)
        .map(Number)
    );
    expect(slices.length).toBeGreaterThan(1);
    const rows = await frames.first().evaluate((frame) =>
      [
        ...(frame as HTMLIFrameElement).contentDocument!.querySelectorAll('tr')
      ].map((row) => {
        const r = row.getBoundingClientRect();
        return [r.top, r.bottom];
      })
    );
    expect(rows).toHaveLength(24);
    await page.getByRole('button', { name: 'Convert to PDF' }).click();
    const bytes = await download(page),
      pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(pdf.getPageCount()).toBe(slices.length);
    const locations: number[][][] = [],
      expected: number[][][] = [];
    for (const [index, [start, end]] of slices.entries()) {
      const [w, h, x, y] = placement(pdf, index),
        ph = pdf.getPage(index).getHeight();
      expect(
        drawnImage(pdf, index)
          .dict.lookup(PDFName.of('Height'), PDFNumber)
          .asNumber()
      ).toBe((end - start) * (scale === '2x' ? 2 : 1));
      expect(w / h).toBeCloseTo(800 / (end - start), 6);
      locations[index] = [[0, 0]];
      expected[index] = [[255, 255, 255]];
      rows.forEach(([top, bottom], i) => {
        if (top >= start && bottom <= end) {
          locations[index].push([
            (x + w * 0.875) * 2,
            (ph - y - h + (((top + bottom) / 2 - start) * h) / (end - start)) *
              2
          ]);
          expected[index].push(colors[i]);
        }
      });
      expect(locations[index].length).toBeGreaterThan(1);
    }
    expect(expected.reduce((n, p) => n + p.length - 1, 0)).toBe(24);
    const actual = await pixels(page, bytes, locations);
    actual.forEach((samples, i) =>
      samples.forEach((rgba, j) =>
        expected[i][j].forEach((v, k) =>
          expect(Math.abs(rgba[k] - v)).toBeLessThanOrEqual(3)
        )
      )
    );
  });
}
test('exact seams, last page is not stretched, trailing blank and fixed-wrapper overflow', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  const html =
    '<div style="height:100px"><div style="height:233px;background-color:red">A</div><div style="height:233px;background-color:green">B</div><div style="height:233px;background-color:blue">C</div><div style="height:99px"></div></div>';
  await page.getByLabel('HTML markup').fill(html);
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const bytes = await download(page),
    pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(2);
  const locations: number[][][] = [];
  for (let i = 0; i < 2; i++) {
    const [w, h, x, y] = placement(pdf, i),
      ph = pdf.getPage(i).getHeight();
    const height = i === 0 ? 466 : 233;
    expect(
      drawnImage(pdf, i).dict.lookup(PDFName.of('Height'), PDFNumber).asNumber()
    ).toBe(height);
    expect(w / h).toBeCloseTo(320 / height, 6);
    const map = (source: number) => [
      (x + w * 0.8) * 2,
      (ph - y - h + (source * h) / height) * 2
    ];
    locations.push(
      i === 0
        ? [map(1), map(232), map(234), map(465)]
        : [map(1), map(232), map(240)]
    );
  }
  const actual = await pixels(page, bytes, locations);
  expect(actual[0]).toEqual([
    [255, 0, 0, 255],
    [255, 0, 0, 255],
    [0, 128, 0, 255],
    [0, 128, 0, 255]
  ]);
  expect(actual[1]).toEqual([
    [0, 0, 255, 255],
    [0, 0, 255, 255],
    [255, 255, 255, 255]
  ]);
});
test('border-only trailing content remains a whole block in preview and actual PDF pixels', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="height:400px;background-color:green">First</div><div style="height:200px;border:4px solid red"></div><div style="height:99px;border:4px solid transparent"></div>'
    );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/^2 pages -/)).toBeVisible();
  await expect(
    page.getByText('Page 2 - source 400..600 px', { exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const bytes = await download(page);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  expect(pdf.getPageCount()).toBe(2);
  expect(
    drawnImage(pdf, 1).dict.lookup(PDFName.of('Height'), PDFNumber).asNumber()
  ).toBe(200);
  const locations = [400, 200].map((height, index) => {
    const [w, h, x, y] = placement(pdf, index);
    const top = pdf.getPage(index).getHeight() - y - h;
    const point = (sx: number, sy: number) => [
      (x + (w * sx) / 320) * 2,
      (top + (h * sy) / height) * 2
    ];
    return index === 0
      ? [point(160, 200)]
      : [point(2, 100), point(160, 198), point(160, 100)];
  });
  expect(await pixels(page, bytes, locations)).toEqual([
    [[0, 128, 0, 255]],
    [
      [255, 0, 0, 255],
      [255, 0, 0, 255],
      [255, 255, 255, 255]
    ]
  ]);
});
test('negative horizontal flex overflow rejects instead of silently cropping and recovers', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="display:flex;flex-direction:column;align-items:flex-end;width:100px"><div style="width:320px;height:100px;background-color:red">Left overflow</div></div>'
    );
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(
    page.getByText(
      'Content exceeds the page width. Reduce fixed widths or use One page.',
      { exact: true }
    )
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page.getByLabel('HTML markup').fill('<p>Recovered</p>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(1);
});
test('oversized row, hidden content, unsupported breaks, budgets and recovery', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  await page
    .getByLabel('HTML markup')
    .fill('<table><tr><td style="height:600px">Too tall</td></tr></table>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/row is taller/)).toBeVisible();
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page
    .getByLabel('HTML markup')
    .fill('<p style="display:none">Invisible</p>');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/No visible content/)).toBeVisible();
  await page.getByLabel('Width (px)').fill('1280');
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="height:1080px">Large</div><div style="height:1080px">Large 2</div>'
    );
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/^Pagination exceeds 4 MP/)).toBeVisible();
  await page.getByRole('button', { name: 'Restore default options' }).click();
  await page
    .getByLabel('HTML markup')
    .fill(
      '<p style="break-inside:avoid;page-break-before:always">Recovered</p>'
    );
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText(/Unsupported inline styles/)).toBeVisible();
  expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(1);
});
test('measurement/capture clone isolation, cancel/edit/reset, SPA unmount, mobile/dark and keyboard recovery', async ({
  page
}) => {
  const leaks: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('blocked.test')) leaks.push(r.url());
  });
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.setViewportSize({ width: 390, height: 844 });
  await mode(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(391);
  await page
    .getByLabel('HTML markup')
    .fill(
      '<script>parent.__attack=1</script><style>@import "https://blocked.test/css"</style><img src="https://blocked.test/image"><p onclick="parent.__attack=1" style="background-image:url(https://blocked.test/bg)">Safe content</p>'
    );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/1 pages -/)).toBeVisible();
  await page.getByLabel('HTML markup').press('Control+Enter');
  const bytes = await download(page);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  expect(leaks).toEqual([]);
  expect(
    await page.evaluate(() => Reflect.get(window, '__attack'))
  ).toBeUndefined();
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.evaluate(() => {
    Reflect.set(window, '__bitmap', createImageBitmap);
    Reflect.set(window, 'createImageBitmap', () => new Promise(() => {}));
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.getByLabel('Left margin (mm)').fill('15');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText(/Conversion cancelled/)).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.locator('a[href="/"]').first().click();
  await page.goBack();
  await expect(page.getByLabel('HTML markup')).toBeVisible();
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page.evaluate(() =>
    Reflect.set(window, 'createImageBitmap', Reflect.get(window, '__bitmap'))
  );
  await page.getByLabel('HTML markup').fill('<p>Recovery</p>');
  await page.getByLabel('HTML markup').press('Control+Enter');
  await download(page);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
});

test('cancel between page captures discards late canvas; new input and SPA unmount recover', async ({
  page
}) => {
  await mode(page);
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="height:600px;background-color:red">First</div><div style="height:600px;background-color:green">Second</div><div style="height:600px;background-color:blue">Third</div>'
    );
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    Reflect.set(window, '__toBlob', original);
    let calls = 0;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      if (++calls === 2) {
        const canvas = this;
        Reflect.set(window, '__heldPage', canvas);
        Reflect.set(window, '__releasePage', () =>
          original.call(canvas, callback, type, quality)
        );
      } else original.call(this, callback, type, quality);
    };
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect
    .poll(() => page.evaluate(() => !!Reflect.get(window, '__heldPage')))
    .toBe(true);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page.evaluate(() => {
    Reflect.set(
      HTMLCanvasElement.prototype,
      'toBlob',
      Reflect.get(window, '__toBlob')
    );
    Reflect.get(window, '__releasePage')();
  });
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, '__heldPage').width))
    .toBe(0);
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  await page.getByLabel('HTML markup').fill('<p>New content</p>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(1);
});
