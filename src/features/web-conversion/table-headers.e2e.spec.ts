import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { drawnImage, placement } from './pdf-baseline/assertions';
import { RASTER_FIXTURES } from './assets.fixtures';
const colors = Array.from({ length: 32 }, (_, i) => [
  40 + i * 5,
  210 - i * 4,
  80 + i * 3
]);
function invoice() {
  return (
    `<p style="margin:0;height:30px">Hóa đơn Nguyễn An</p><table style="width:100%;font-size:14px"><thead><tr><th colspan="2" style="height:28px;padding:0;text-align:left;background-color:rgb(180,40,90)">Invoice header<img src="${RASTER_FIXTURES.png}" width="12" height="12"></th></tr><tr><th style="width:30%;height:30px;padding:0;text-align:left;background-color:rgb(30,60,220)">Mã</th><th style="height:30px;padding:0;text-align:left;background-color:rgb(220,160,30)">Thông tin hàng hóa</th></tr></thead><tbody>` +
    colors
      .map(
        (c, i) =>
          `<tr><td style="height:62px;padding:0;background-color:rgb(${c})">Row ${i}</td><td style="padding:0;background-color:rgb(${c})">Nguyễn ${i} ${
            i === 0
              ? `<img src="${RASTER_FIXTURES.png}" width="12" height="12"><img src="${RASTER_FIXTURES.jpeg}" width="12" height="12">`
              : ''
          }</td></tr>`
      )
      .join('') +
    '</tbody></table><p style="margin:0;height:30px">End invoice</p>'
  );
}
async function mode(page: Page) {
  await page.goto('/pdf/html-to-pdf');
  await page.getByLabel('PDF layout', { exact: true }).click();
  await page.getByRole('option', { name: 'Paginated', exact: true }).click();
  await expect(
    page.getByLabel('Repeat table headers', { exact: true })
  ).not.toBeChecked();
  await page.getByLabel('Repeat table headers', { exact: true }).check();
}
async function bytes(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll('button')].some(
      (b) => b.textContent === 'Convert to PDF' && !b.disabled
    )
  );
  const link = page.getByRole('link', { name: 'Download PDF', exact: true });
  await expect(link).toBeVisible();
  const event = page.waitForEvent('download');
  await link.click();
  return readFile((await (await event).path())!);
}
async function raster(page: Page, data: Buffer, points: number[][][]) {
  await page.goto('/pdf/pdf-to-png');
  await page.locator('input[type=file]').setInputFiles({
    name: 'headers.pdf',
    mimeType: 'application/pdf',
    buffer: data
  });
  await page.waitForFunction(
    () => !!document.querySelector('img[alt="Preview 0"]')
  );
  const result: number[][][] = [];
  for (const [i, samples] of points.entries()) {
    const image = page.locator(`img[alt="Preview ${i}"]`);
    await expect(image).toBeVisible();
    result.push(
      await image.evaluate(async (el, samples) => {
        const bitmap = await createImageBitmap(
          await (await fetch((el as HTMLImageElement).src)).blob()
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const values = samples.map(([x, y]) => [
          ...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
        ]);
        bitmap.close();
        canvas.width = canvas.height = 0;
        return values;
      }, samples)
    );
  }
  return result;
}
for (const [paper, orientation, scale] of [
  ['A4', 'Portrait', '1x'],
  ['Letter', 'Landscape', '2x']
] as const) {
  test(`${paper}/${orientation}/${scale}: repeated multi-row colspan headers, stable columns, every row once and PDF seam pixels`, async ({
    page
  }) => {
    await mode(page);
    await page.getByLabel('Width (px)').fill('480');
    for (const [label, value] of [
      ['Paper size', paper],
      ['Page orientation', orientation],
      ['Scale', scale]
    ]) {
      await page.getByLabel(label, { exact: true }).click();
      await page.getByRole('option', { name: new RegExp(`^${value}`) }).click();
    }
    await page.getByLabel('Top margin (mm)').fill('12');
    await page.getByLabel('Left margin (mm)').fill('5');
    await page.getByLabel('Right margin (mm)').fill('20');
    await page.getByLabel('Upload HTML file').setInputFiles({
      name: 'Hóa đơn.html',
      mimeType: 'text/html',
      buffer: Buffer.from(invoice())
    });
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByText(/pages - same source bounds/)).toBeVisible();
    const bounds = (
      await page.getByText(/^Page \d+ - source/).allTextContents()
    ).map((t) =>
      t
        .match(/source (\d+)\.\.(\d+)/)!
        .slice(1)
        .map(Number)
    );
    expect(bounds.length).toBeGreaterThanOrEqual(4);
    const frames = page.locator('iframe[title^="Paginated preview"]');
    const rows = await frames.first().evaluate((f) => {
      const doc = (f as HTMLIFrameElement).contentDocument!,
        root = doc.querySelector('[data-page-source]')!,
        origin = root.getBoundingClientRect();
      return [...root.querySelectorAll('tbody tr')].map((r) => {
        const b = r.getBoundingClientRect();
        return [b.top - origin.top, b.bottom - origin.top];
      });
    });
    const reserves: number[] = [];
    for (let i = 0; i < bounds.length; i++) {
      const f = frames.nth(i);
      if (
        i === 0 ||
        !rows.some(
          ([top, bottom]) =>
            top >= bounds[i][0] - 0.5 && bottom <= bounds[i][1] + 0.5
        )
      ) {
        reserves.push(0);
        continue;
      }
      await expect
        .poll(() =>
          f.evaluate(
            (f) =>
              !!(f as HTMLIFrameElement).contentDocument?.querySelector(
                '[data-repeated-header]'
              )
          )
        )
        .toBe(true);
      const geometry = await f.evaluate((f) => {
        const doc = (f as HTMLIFrameElement).contentDocument!,
          head = doc.querySelector('[data-repeated-header]')!,
          original = [
            ...doc.querySelectorAll('[data-page-source] thead tr:last-child th')
          ],
          clones = [...head.querySelectorAll('tr:last-child th')];
        const clip = doc.querySelector('[data-page-clip]')!;
        return {
          height: head.getBoundingClientRect().height,
          clip: clip.getBoundingClientRect().top,
          columns: original.map((e, i) => [
            e.getBoundingClientRect().width,
            clones[i].getBoundingClientRect().width
          ])
        };
      });
      expect(geometry.clip).toBe(geometry.height);
      geometry.columns.forEach(([a, b]) =>
        expect(Math.abs(a - b)).toBeLessThanOrEqual(0.5)
      );
      reserves.push(geometry.height);
    }
    // Export all first: inspect every body-row center and both header rows in real PDF.js pixels.
    await page.getByRole('button', { name: 'Convert to PDF' }).click();
    const all = await bytes(page),
      pdf = await PDFDocument.load(all, { updateMetadata: false });
    expect(pdf.getPageCount()).toBe(bounds.length);
    const points: number[][][] = [],
      expected: number[][][] = [],
      seen: number[] = [];
    for (const [i, [start, end]] of bounds.entries()) {
      const [w, h, x, y] = placement(pdf, i),
        ph = pdf.getPage(i).getHeight(),
        r = reserves[i],
        height = end - start + r;
      expect(
        drawnImage(pdf, i)
          .dict.lookup(PDFName.of('Height'), PDFNumber)
          .asNumber()
      ).toBe(height * (scale === '2x' ? 2 : 1));
      expect(w / h).toBeCloseTo(480 / height, 6);
      const map = (sx: number, sy: number) => [
        (x + (w * sx) / 480) * 2,
        (ph - y - h + (h * sy) / height) * 2
      ];
      points[i] = [];
      expected[i] = [];
      if (r) {
        points[i].push(map(400, 14), map(400, 44), map(50, 44));
        expected[i].push([180, 40, 90], [220, 160, 30], [30, 60, 220]);
      }
      rows.forEach(([top, bottom], row) => {
        if (top >= start - 0.5 && bottom <= end + 0.5) {
          points[i].push(
            map(400, r + top + 2 - start),
            map(400, r + (top + bottom) / 2 - start),
            map(400, r + bottom - 2 - start)
          );
          expected[i].push(colors[row], colors[row], colors[row]);
          seen.push(row);
        }
      });
    }
    expect(seen).toEqual(colors.map((_, i) => i));
    const actual = await raster(page, all, points);
    actual.forEach((samples, i) =>
      samples.forEach((rgba, j) =>
        expected[i][j].forEach((v, k) =>
          expect(
            Math.abs(rgba[k] - v),
            `page ${i} sample ${j}: ${rgba} expected ${expected[i][j]}`
          ).toBeLessThanOrEqual(3)
        )
      )
    );
  });
}
test('selected continuation pages 2/4 contain their own header and correct original row pixels without page 1', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('480');
  await page.getByLabel('HTML markup').fill(invoice());
  await page.getByLabel('Pages to export', { exact: true }).click();
  await page.getByRole('option', { name: 'Custom ranges' }).click();
  await page.getByLabel('Page ranges').fill('4,2,2');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  const data = await bytes(page),
    pdf = await PDFDocument.load(data);
  expect(pdf.getPageCount()).toBe(2);
  const bounds = (
    await page.getByText(/^Page \d+ - source/).allTextContents()
  ).map((t) =>
    t
      .match(/source (\d+)\.\.(\d+)/)!
      .slice(1)
      .map(Number)
  );
  expect(
    await page.getByText(/^Source page \d+ - output/).allTextContents()
  ).toEqual([
    'Source page 2 - output page 1 of 2',
    'Source page 4 - output page 2 of 2'
  ]);
  const frames = page.locator('iframe[title^="Paginated preview"]'),
    points: number[][][] = [],
    expected: number[][][] = [];
  for (const [i, [start, end]] of bounds.entries()) {
    const geometry = await frames.nth(i).evaluate((f) => {
      const d = (f as HTMLIFrameElement).contentDocument!,
        source = d.querySelector('[data-page-source]')!,
        origin = source.getBoundingClientRect();
      return {
        reserve: d
          .querySelector('[data-repeated-header]')!
          .getBoundingClientRect().height,
        rows: [...source.querySelectorAll('tbody tr')].map((r) => {
          const b = r.getBoundingClientRect();
          return [b.top - origin.top, b.bottom - origin.top];
        })
      };
    });
    const [w, h, x, y] = placement(pdf, i),
      ph = pdf.getPage(i).getHeight(),
      height = end - start + geometry.reserve;
    const map = (sy: number) => [
      (x + (w * 400) / 480) * 2,
      (ph - y - h + (h * sy) / height) * 2
    ];
    points[i] = [map(14)];
    expected[i] = [[180, 40, 90]];
    geometry.rows.forEach(([top, bottom], row) => {
      if (top >= start - 0.5 && bottom <= end + 0.5) {
        points[i].push(map(geometry.reserve + (top + bottom) / 2 - start));
        expected[i].push(colors[row]);
      }
    });
    expect(points[i].length).toBeGreaterThan(1);
  }
  const actual = await raster(page, data, points);
  actual.forEach((samples, i) =>
    samples.forEach((rgba, j) =>
      expected[i][j].forEach((v, k) =>
        expect(
          Math.abs(rgba[k] - v),
          `page ${i} sample ${j}: ${rgba} expected ${expected[i][j]}`
        ).toBeLessThanOrEqual(3)
      )
    )
  );
});
test('unsupported table policies, header+row overflow and no implicit header recover with option Off', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  const tables = [
    '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td rowspan="2">B</td></tr><tr><td>C</td></tr></tbody></table>',
    '<table><caption>Caption</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table>',
    '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody><tfoot><tr><td>Footer</td></tr></tfoot></table>',
    '<div style="display:flex"><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table></div>',
    '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td><table><tr><td>Nested</td></tr></table></td></tr></tbody></table>',
    '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td colspan="2">Span</td></tr></tbody></table>'
  ];
  for (const markup of tables) {
    await page.getByLabel('HTML markup').fill(markup);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByText(/Repeat table headers supports/)).toBeVisible();
    await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  }
  await page
    .getByLabel('HTML markup')
    .fill(
      '<table><thead><tr><th style="height:250px">Header</th></tr></thead><tbody><tr><td style="height:250px">Body</td></tr></tbody></table>'
    );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/Repeated header and a body row/)).toBeVisible();
  await page.getByLabel('Repeat table headers', { exact: true }).uncheck();
  await page
    .getByLabel('HTML markup')
    .fill('<table><tr><td style="height:80px">No thead</td></tr></table>');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  expect((await PDFDocument.load(await bytes(page))).getPageCount()).toBe(1);
});
test('two normal-flow tables and following paragraphs repeat only their own headers', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  const table = (color: string, label: string) =>
    `<table style="width:100%"><thead><tr><th style="background-color:${color}">${label}</th></tr></thead><tbody>${Array.from(
      { length: 12 },
      (_, i) => `<tr><td style="height:50px">${label} ${i}</td></tr>`
    ).join('')}</tbody></table>`;
  await page
    .getByLabel('HTML markup')
    .fill(
      table('red', 'First') +
        '<p style="height:100px">Between</p>' +
        table('blue', 'Second') +
        '<p style="height:450px">After</p>'
    );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/pages - same/)).toBeVisible();
  const frames = page.locator('iframe[title^="Paginated preview"]');
  expect(await frames.count()).toBeGreaterThan(3);
  await expect
    .poll(async () => {
      const texts = await frames.evaluateAll((fs) =>
        fs.map(
          (f) =>
            (f as HTMLIFrameElement).contentDocument?.querySelector(
              '[data-repeated-header]'
            )?.textContent ?? ''
        )
      );
      return texts.includes('First') && texts.includes('Second');
    })
    .toBe(true);
  const last = frames.last();
  expect(
    await last.evaluate(
      (f) =>
        (f as HTMLIFrameElement).contentDocument?.querySelector(
          '[data-repeated-header]'
        )?.textContent ?? ''
    )
  ).toBe('');
});
test('script/network isolation in repeated clone, mobile/dark/keyboard, cancel/edit/unmount and recovery', async ({
  page
}) => {
  const leaks: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('blocked.test')) leaks.push(r.url());
  });
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.setViewportSize({ width: 390, height: 844 });
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(391);
  const html =
    '<table style="width:100%"><thead><tr><th style="background-color:rgb(180,40,90)">Safe<script>parent.__headerAttack=1</script><img src="https://blocked.test/img" onerror="parent.__headerAttack=1"><a href="https://blocked.test/nav">Label</a><style>@import "https://blocked.test/css"</style></th></tr></thead><tbody>' +
    Array.from(
      { length: 18 },
      (_, i) => `<tr><td style="height:60px">Row ${i}</td></tr>`
    ).join('') +
    '</tbody></table>';
  await page.getByLabel('HTML markup').fill(html);
  await page.getByLabel('HTML markup').press('Control+Enter');
  const result = await bytes(page);
  expect((await PDFDocument.load(result)).getPageCount()).toBeGreaterThan(2);
  expect(leaks).toEqual([]);
  expect(
    await page.evaluate(() => Reflect.get(window, '__headerAttack'))
  ).toBeUndefined();
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    Reflect.set(window, '__headerBlob', original);
    let calls = 0;
    HTMLCanvasElement.prototype.toBlob = function (cb, type, quality) {
      if (++calls === 2) {
        const canvas = this;
        Reflect.set(window, '__headerCanvas', canvas);
        Reflect.set(window, '__releaseHeader', () =>
          original.call(canvas, cb, type, quality)
        );
      } else original.call(this, cb, type, quality);
    };
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect
    .poll(() => page.evaluate(() => !!Reflect.get(window, '__headerCanvas')))
    .toBe(true);
  // Toggle invalidates the run, including an already captured continuation page.
  await page.getByLabel('Repeat table headers', { exact: true }).uncheck();
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page.evaluate(() => {
    Reflect.set(
      HTMLCanvasElement.prototype,
      'toBlob',
      Reflect.get(window, '__headerBlob')
    );
    Reflect.get(window, '__releaseHeader')();
  });
  await expect
    .poll(() =>
      page.evaluate(() => Reflect.get(window, '__headerCanvas').width)
    )
    .toBe(0);
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
  await page.getByLabel('Repeat table headers', { exact: true }).check();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText(/Conversion cancelled/)).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.locator('a[href="/"]').first().click();
  await page.goBack();
  await expect(page.getByLabel('HTML markup')).toBeVisible();
  await expect(page.locator('[data-html-renderer]')).toHaveCount(0);
  await page.getByLabel('HTML markup').fill('<p>Recovered</p>');
  await page.getByLabel('HTML markup').press('Control+Enter');
  expect((await PDFDocument.load(await bytes(page))).getPageCount()).toBe(1);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0);
});
test('wrapped headers preserve measured height; hidden tables and absent thead do not invent headers; column cap rejects', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  const markup =
    '<table style="display:none"><thead><tr><th>Hidden</th></tr></thead></table><table style="width:100%"><thead><tr><th style="width:20%;background-color:rgb(180,40,90)">Thông tin chi tiết sản phẩm</th><th>Value</th></tr></thead><tbody>' +
    Array.from(
      { length: 18 },
      (_, i) => `<tr><td style="height:60px">${i}</td><td>Value</td></tr>`
    ).join('') +
    '</tbody></table>';
  await page.getByLabel('HTML markup').fill(markup);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/pages - same/)).toBeVisible();
  const frame = page.locator('iframe[title^="Paginated preview"]').nth(1);
  await expect
    .poll(() =>
      frame.evaluate(
        (f) =>
          !!(f as HTMLIFrameElement).contentDocument?.querySelector(
            '[data-repeated-header]'
          )
      )
    )
    .toBe(true);
  const sizes = await frame.evaluate((f) => {
    const doc = (f as HTMLIFrameElement).contentDocument!;
    return [
      ...doc.querySelectorAll(
        '[data-page-source] table:not([style*="display: none"]) thead th:first-child, [data-repeated-header] thead th:first-child'
      )
    ].map((c) => c.getBoundingClientRect().height);
  });
  expect(sizes).toHaveLength(2);
  expect(sizes[0]).toBeGreaterThan(50);
  expect(Math.abs(sizes[0] - sizes[1])).toBeLessThanOrEqual(0.5);
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  expect(
    (await PDFDocument.load(await bytes(page))).getPageCount()
  ).toBeGreaterThan(2);
  await page.getByLabel('Width (px)').fill('1280');
  const cells = Array.from({ length: 21 }, () => '<th>A</th>').join(''),
    body = Array.from({ length: 21 }, () => '<td>B</td>').join('');
  await page
    .getByLabel('HTML markup')
    .fill(
      `<table style="font-size:8px"><thead><tr>${cells}</tr></thead><tbody><tr>${body}</tr></tbody></table>`
    );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/Repeat table headers supports/)).toBeVisible();
  await page
    .getByLabel('HTML markup')
    .fill('<table><tr><td>No thead</td></tr></table>');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByText(/1 pages -/)).toBeVisible();
  expect(
    await page
      .locator('iframe[title^="Paginated preview"]')
      .evaluateAll((fs) =>
        fs.some(
          (f) =>
            (f as HTMLIFrameElement).contentDocument?.querySelector(
              '[data-repeated-header]'
            )
        )
      )
  ).toBe(false);
});
test('outer borders and separate-border spacing retain column geometry or reject drift explicitly', async ({
  page
}) => {
  await mode(page);
  await page.getByLabel('Width (px)').fill('320');
  for (const style of ['border:3px solid black', 'border-collapse:separate']) {
    await page
      .getByLabel('HTML markup')
      .fill(
        `<table style="width:100%;${style}"><thead><tr><th>A</th><th>Long header column</th></tr></thead><tbody>${Array.from(
          { length: 12 },
          (_, i) =>
            `<tr><td style="height:60px">${i}</td><td>Body row</td></tr>`
        ).join('')}</tbody></table>`
      );
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent === 'Preview' && !b.disabled
      )
    );
    const drift = page.getByText(
      /Repeated header changed column widths or wrapping/
    );
    if (await drift.isVisible()) {
      await expect(
        page.getByRole('link', { name: 'Download PDF' })
      ).toHaveCount(0);
      continue;
    }
    await expect(page.getByText(/pages - same/)).toBeVisible();
    const frame = page.locator('iframe[title^="Paginated preview"]').nth(1);
    await expect
      .poll(() =>
        frame.evaluate(
          (f) =>
            !!(f as HTMLIFrameElement).contentDocument?.querySelector(
              '[data-repeated-header]'
            )
        )
      )
      .toBe(true);
    const differences = await frame.evaluate((f) => {
      const d = (f as HTMLIFrameElement).contentDocument!,
        original = [...d.querySelectorAll('[data-page-source] thead th')],
        copy = [...d.querySelectorAll('[data-repeated-header] thead th')];
      return original.map((c, i) =>
        Math.abs(
          c.getBoundingClientRect().width -
            copy[i].getBoundingClientRect().width
        )
      );
    });
    differences.forEach((diff) => expect(diff).toBeLessThanOrEqual(0.5));
    await page.getByRole('button', { name: 'Convert to PDF' }).click();
    expect(
      (await PDFDocument.load(await bytes(page))).getPageCount()
    ).toBeGreaterThan(1);
  }
});
