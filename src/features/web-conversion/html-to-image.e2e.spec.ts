import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { RASTER_FIXTURES } from './assets.fixtures';

async function decode(page: Page, bytes: Buffer) {
  return page.evaluate(async (base64) => {
    const blob = await (
      await fetch(`data:application/octet-stream;base64,${base64}`)
    ).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const corner = [
      ...ctx.getImageData(bitmap.width - 1, bitmap.height - 1, 1, 1).data
    ];
    const interior = [...ctx.getImageData(20, 20, 1, 1).data];
    bitmap.close();
    return { width: canvas.width, height: canvas.height, corner, interior };
  }, bytes.toString('base64'));
}
test('warns for a crossing table row, preserves crop pixels and strict mode recovers after resizing', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="height:150px;background-color:#ff0000">Header</div><table style="width:100%"><tr><td style="height:100px;padding:0;border:0px solid white;background-color:#00ff00">Nguyễn An</td></tr></table>'
    );
  await page.getByLabel('Width (px)').fill('400');
  await page.getByLabel('Height (px)').fill('200');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page.getByText(/1 table row\(s\) cross the bottom/)
  ).toBeVisible();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page.getByText(/1 table row\(s\) cross the bottom/)
  ).toBeVisible();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const pixels = await decode(
    page,
    await readFile((await (await downloaded).path())!)
  );
  expect(pixels.interior).toEqual([255, 0, 0, 255]);
  expect(pixels.corner).toEqual([0, 255, 0, 255]);
  await page.getByLabel('Overflow handling', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Stop if content is cropped' })
    .click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(
    page.getByText(/Export stopped because content would be cropped/)
  ).toBeVisible();
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
  await page.getByLabel('Height (px)').fill('300');
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  await expect(page.getByText(/table row\(s\) cross the bottom/)).toHaveCount(
    0
  );
});
test('exact table boundaries and safe font stacks match preview and 2x output', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<table style="width:100%;font-family:Arial,sans-serif"><tr><td style="height:100px;padding:0;border:0px solid white;background-color:#ff0000">Nguyễn An</td></tr><tr><td style="height:100px;padding:0;border:0px solid white;background-color:#00ff00;font-family:system-ui,monospace">line 2</td></tr></table>'
    );
  await page.getByLabel('Width (px)').fill('400');
  await page.getByLabel('Height (px)').fill('200');
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page.getByLabel('Overflow handling', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Stop if content is cropped' })
    .click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const table = page
    .frameLocator('iframe[title="Sanitized HTML preview"]')
    .locator('table');
  await expect(table).toBeVisible();
  expect(
    await table.evaluate((node) => getComputedStyle(node).fontFamily)
  ).toMatch(/Arial.*sans-serif/i);
  await expect(
    page.getByText(/Content exceeds|table row\(s\) cross/)
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Convert to image' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const image = await decode(
    page,
    await readFile((await (await downloaded).path())!)
  );
  expect([image.width, image.height]).toEqual([800, 400]);
  expect(image.corner).toEqual([0, 255, 0, 255]);
});
test('horizontal overflow is explicit and unsupported custom fonts/page breaks stay blocked', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<div style="width:1280px;font-family:CustomFont,serif;break-inside:avoid">Wide</div>'
    );
  await page.getByLabel('Width (px)').fill('400');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page.getByText(/Content exceeds the image width\./)
  ).toBeVisible();
  await expect(
    page.getByText(/Unsupported inline styles were removed/)
  ).toBeVisible();
  const content = page
    .frameLocator('iframe[title="Sanitized HTML preview"]')
    .locator('body > div');
  expect(await content.getAttribute('style')).not.toMatch(
    /CustomFont|break-inside/
  );
  await page.getByLabel('Overflow handling', { exact: true }).click();
  await page
    .getByRole('option', { name: 'Stop if content is cropped' })
    .click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(page.getByText(/Export stopped/)).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByText(/Content exceeds|Export stopped/)).toHaveCount(0);
});
test('paste, preview and download a real PNG, then clear stale output on edit', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page
      .frameLocator('iframe[title="Sanitized HTML preview"]')
      .getByText('Total: $400')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const bytes = await readFile((await (await download).path())!);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const image = await decode(page, bytes);
  expect([image.width, image.height]).toEqual([800, 600]);
  expect(image.interior).toEqual([240, 253, 250, 255]);
  await page.getByLabel('HTML markup').fill('<p>New input</p>');
  await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveCount(0);
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
});
test('upload HTML, JPEG and transparent PNG export use actual chosen options', async ({
  page
}) => {
  await page.goto('/image-generic/html-to-image');
  await page.getByLabel('Upload HTML file').setInputFiles({
    name: 'invoice.html',
    mimeType: 'text/html',
    buffer: Buffer.from('<p>Nguyễn An</p>')
  });
  await page.getByLabel('Width (px)').fill('400');
  await page.getByLabel('Height (px)').fill('200');
  await page.getByLabel('Background', { exact: true }).click();
  await page.getByRole('option', { name: 'Transparent' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  let downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  let image = await decode(
    page,
    await readFile((await (await downloaded).path())!)
  );
  expect([image.width, image.height]).toEqual([400, 200]);
  expect(image.corner[3]).toBe(0);
  await page.getByLabel('Format', { exact: true }).click();
  await page.getByRole('option', { name: 'JPEG' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download JPEG' }).click();
  const bytes = await readFile((await (await downloaded).path())!);
  expect([...bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
  image = await decode(page, bytes);
  expect(image.corner).toEqual([255, 255, 255, 255]);
});
test('removes hostile markup with no content requests and recovers from limits', async ({
  page
}) => {
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('blocked.test')) requests.push(r.url());
  });
  await page.goto('/image-generic/html-to-image');
  await page
    .getByLabel('HTML markup')
    .fill(
      '<script>parent.__htmlAttack=true</script><img src="https://blocked.test/x"><style>@import "https://blocked.test/css"</style><div id="constructor" onclick="alert(1)" style="background-image:url(https://blocked.test/bg);color:red">Safe</div>'
    );
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  expect(requests).toEqual([]);
  await expect(
    page
      .frameLocator('iframe[title="Sanitized HTML preview"]')
      .locator('[id], [onclick], img, script, style:not(head style)')
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Object.prototype.hasOwnProperty.call(window, '__htmlAttack')
    )
  ).toBe(false);
  await page.getByLabel('Width (px)').fill('1280');
  await page.getByLabel('Height (px)').fill('1080');
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(
    page.getByText('Output exceeds 2 megapixels. Reduce dimensions or scale.')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restore default options' }).click();
  await page.getByLabel('HTML markup').press('Control+Enter');
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
});
test('mobile layout, empty/unsupported files, cancel and reset remain usable', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/image-generic/html-to-image');
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(
    page.getByText('Enter HTML or upload an HTML file.')
  ).toBeVisible();
  await page.getByLabel('Upload HTML file').setInputFiles({
    name: 'bad.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hi')
  });
  await expect(page.getByText('Choose an .html or .htm file.')).toBeVisible();
  await page.getByLabel('Upload HTML file').setInputFiles({
    name: 'large.html',
    mimeType: 'text/html',
    buffer: Buffer.alloc(65537, 'a')
  });
  await expect(page.getByText('HTML must be at most 64 KiB.')).toBeVisible();
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.route('**/assets/renderer-*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });
  await page.getByRole('button', { name: 'Convert to image' }).click();
  // Keyboard activation avoids pointer waits that can outlast a short capture.
  await page
    .getByRole('button', { name: 'Cancel', exact: true })
    .press('Enter');
  await expect(
    page.getByText('Conversion cancelled. Edit or convert again to retry.')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('HTML markup')).toHaveValue('');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
});

test('dark mode does not leak into the image and 2x scale changes actual pixels', async ({
  page
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/image-generic/html-to-image');
  await page.getByLabel('HTML markup').fill('<p>Dark-mode invoice</p>');
  await page.getByLabel('Scale', { exact: true }).click();
  await page.getByRole('option', { name: '2x' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const result = await decode(
    page,
    await readFile((await (await downloaded).path())!)
  );
  expect([result.width, result.height]).toEqual([1600, 1200]);
  expect(result.corner).toEqual([255, 255, 255, 255]);
  await page.goto('/');
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
});

for (const [format, source] of Object.entries(RASTER_FIXTURES)) {
  test(`embedded ${format}: preview and download include actual raster pixels`, async ({
    page
  }) => {
    await page.goto('/image-generic/html-to-image');
    await page
      .getByLabel('HTML markup')
      .fill(
        `<img src="${source}" alt="Embedded red logo" width="32" height="32" style="display:block"><p>Invoice with logo</p>`
      );
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(
      page
        .frameLocator('iframe[title="Sanitized HTML preview"]')
        .getByAltText('Embedded red logo')
    ).toHaveJSProperty('naturalWidth', 16);
    if (format === 'jpeg') {
      await page.getByLabel('Format', { exact: true }).click();
      await page.getByRole('option', { name: 'JPEG' }).click();
    }
    await page.getByRole('button', { name: 'Convert to image' }).click();
    const downloaded = page.waitForEvent('download');
    await page
      .getByRole('link', {
        name: format === 'png' ? 'Download PNG' : 'Download JPEG'
      })
      .click();
    const bytes = await readFile((await (await downloaded).path())!);
    expect(bytes[0]).toBe(format === 'png' ? 137 : 255);
    const image = await decode(page, bytes);
    expect(image.interior[0]).toBeGreaterThan(240);
    expect(image.interior[1]).toBeLessThan(20);
    expect(image.interior[2]).toBeLessThan(20);
    expect(image.interior[3]).toBe(255);
    await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
  });
}

test('rejects image pixel bombs before native decode and blocks external/srcset/SVG assets', async ({
  page
}) => {
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window);
    Reflect.set(window, '__bitmapCalls', 0);
    window.createImageBitmap = ((source: ImageBitmapSource) => {
      Reflect.set(
        window,
        '__bitmapCalls',
        Reflect.get(window, '__bitmapCalls') + 1
      );
      return original(source);
    }) as typeof createImageBitmap;
  });
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('blocked.test')) requests.push(r.url());
  });
  await page.goto('/image-generic/html-to-image');
  const bomb = Buffer.from(RASTER_FIXTURES.png.split(',')[1], 'base64');
  bomb.writeUInt32BE(100000, 16);
  await page
    .getByLabel('HTML markup')
    .fill(
      `<img src="data:image/png;base64,${bomb.toString(
        'base64'
      )}"><p>Bad image</p>`
    );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page.getByText(
      'Embedded images must be at most 1024 px per side and 500000 pixels each.'
    )
  ).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, '__bitmapCalls'))).toBe(
    0
  );
  await expect(
    page.locator('iframe[title="Sanitized HTML preview"]')
  ).toHaveCount(0);
  await page
    .getByLabel('HTML markup')
    .fill(
      `<img src="https://blocked.test/logo"><img src="data:image/svg+xml;base64,PHN2Zy8+"><img src="${RASTER_FIXTURES.png}" alt="Safe logo" srcset="https://blocked.test/large 2x" onerror="parent.__assetAttack=true" width="32" height="32" style="display:block">`
    );
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  const preview = page.frameLocator('iframe[title="Sanitized HTML preview"]');
  await expect(preview.locator('img')).toHaveCount(1);
  await expect(preview.locator('[srcset],[onerror]')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => Reflect.get(window, '__assetAttack'))
  ).toBeUndefined();
});

test('stalled native image decode times out, cancels, stays responsive and recovers', async ({
  page
}) => {
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window);
    Reflect.set(window, '__stallNextBitmap', true);
    window.createImageBitmap = ((source: ImageBitmapSource) => {
      if (Reflect.get(window, '__stallNextBitmap')) {
        Reflect.set(window, '__stallNextBitmap', false);
        return new Promise<ImageBitmap>(() => {});
      }
      return original(source);
    }) as typeof createImageBitmap;
  });
  await page.goto('/image-generic/html-to-image');
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('button', { name: 'Convert to image' }).click();
  expect(await page.evaluate(() => 1 + 1)).toBe(2);
  await expect(
    page.getByText('Embedded image decoding timed out. Use smaller images.')
  ).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
  await page.evaluate(() => Reflect.set(window, '__stallNextBitmap', true));
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await page
    .getByRole('button', { name: 'Cancel', exact: true })
    .press('Enter');
  await expect(
    page.getByText('Conversion cancelled. Edit or convert again to retry.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveCount(0);
  await expect(page.locator('iframe[data-html-renderer]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Convert to image' }).click();
  await expect(page.getByRole('link', { name: 'Download PNG' })).toBeVisible();
});
