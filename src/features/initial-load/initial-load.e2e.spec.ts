import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

test('homepage search is usable without tool guides, fallback catalog or heavy runtimes', async ({
  page
}) => {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.goto('/');
  const search = page.locator('input[role=combobox]');
  await expect(search).toBeVisible();
  expect(
    urls.filter((url) =>
      /\/(overrides-|english-fallback-|heic-to-|ort[.-]|pdf\.worker)|\.wasm(?:$|\?)/.test(
        url
      )
    )
  ).toEqual([]);
  await search.fill('Split PDF');
  await expect(
    page.getByRole('option').filter({ hasText: 'Split PDF' })
  ).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.locator('input[type=file]')).toBeAttached();
});

async function splitPdfChunk() {
  const files = await readdir('dist/assets');
  const candidates = await Promise.all(
    files
      .filter((file) => file.endsWith('.js'))
      .map(async (file) => ({
        file,
        source: await readFile(`dist/assets/${file}`, 'utf8')
      }))
  );
  const chunk = candidates.find(({ source }) =>
    source.includes('Extract Specific Pages')
  );
  expect(chunk, 'locate the built Split PDF route chunk').toBeDefined();
  return chunk!.file;
}

test('loading a route keeps the footer below the mobile viewport', async ({
  page
}) => {
  const chunk = await splitPdfChunk();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/assets/${chunk}`, async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pdf/split-pdf', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Loading', { exact: true })).toBeVisible();
    const footer = await page.locator('footer').boundingBox();
    expect(footer!.y).toBeGreaterThanOrEqual(844);
    release();
    await expect(page.locator('input[type=file]')).toBeAttached();
  } finally {
    release();
  }
});

test('Split PDF exports selected pages and clear invalidates the previous download', async ({
  page
}) => {
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 300]);
  pdf.addPage([300, 400]);
  pdf.addPage([400, 500]);
  await page.goto('/pdf/split-pdf');
  const tool = page.locator('#tool');
  const range = page.getByPlaceholder('e.g., 1,5-8').first();
  await range.fill('1,3');
  await expect(range).toHaveValue('1,3');
  await tool.locator('input[type=file]').setInputFiles({
    name: 'three-pages.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save())
  });
  const download = tool.getByRole('button', { name: 'Download', exact: true });
  await expect(range).toHaveValue('1,3');
  await expect(download).toBeEnabled();
  const pending = page.waitForEvent('download');
  await download.click();
  const artifactPath = await (await pending).path();
  expect(artifactPath).not.toBeNull();
  const result = await PDFDocument.load(await readFile(artifactPath!));
  expect(result.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([
    [200, 300],
    [400, 500]
  ]);
  await tool.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(download).toBeDisabled();
  await expect(page.getByText('PDF has 3 pages', { exact: true })).toHaveCount(
    0
  );
  await tool.locator('input[type=file]').setInputFiles({
    name: 'invalid.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('invalid PDF fixture')
  });
  await expect(page.getByRole('alert')).toContainText(
    'Unable to split this PDF'
  );
  await expect(download).toBeDisabled();
  await tool.locator('input[type=file]').setInputFiles({
    name: 'valid-again.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save())
  });
  await expect(download).toBeEnabled();
});

test('clearing a PDF while its read is pending prevents stale output and page count', async ({
  page
}) => {
  await page.addInitScript(() => {
    const gate = window as typeof window & {
      __pdfReleases: (() => Promise<void>)[];
    };
    gate.__pdfReleases = [];
    const original = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = function () {
      if (this.name !== 'held.pdf') return original.call(this);
      return new Promise<ArrayBuffer>((resolve) => {
        gate.__pdfReleases.push(async () => {
          resolve(await original.call(this));
        });
      });
    };
  });
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 300]);
  await page.goto('/pdf/split-pdf');
  const tool = page.locator('#tool');
  await tool.locator('input[type=file]').setInputFiles({
    name: 'held.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save())
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __pdfReleases: unknown[] }).__pdfReleases
            .length
      )
    )
    .toBeGreaterThanOrEqual(2);
  await tool.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.evaluate(async () => {
    await Promise.all(
      (
        window as typeof window & { __pdfReleases: (() => Promise<void>)[] }
      ).__pdfReleases.map((release) => release())
    );
    // Drain the tiny PDF's promise continuations and render before observing state.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
  await expect(
    tool.getByRole('button', { name: 'Download', exact: true })
  ).toBeDisabled();
  await expect(page.getByText('PDF has 1 page', { exact: true })).toHaveCount(
    0
  );
});

test('a light tool works without requesting unrelated translation namespaces', async ({
  page
}) => {
  const namespaces: string[] = [];
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/locales/en/*.json', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!;
    namespaces.push(name);
    if (!['translation.json', 'string.json'].includes(name)) await held;
    await route.continue();
  });
  try {
    await page.goto('/string/reverse');
    const input = page
      .locator('textarea:not([readonly]):not([aria-hidden="true"])')
      .first();
    await expect(input).toBeVisible();
    await input.fill('Orvulix');
    await expect(page.getByTestId('text-result')).toHaveValue('xiluvrO');
    expect(
      namespaces.filter(
        (name) => !['translation.json', 'string.json'].includes(name)
      )
    ).toEqual([]);
  } finally {
    release();
  }
});

test('tool input does not move when remote icons become available', async ({
  page
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://api.iconify.design/**', async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/string/reverse');
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /see examples/i })
    ).toBeVisible();
    const before = await page.locator('#tool').boundingBox();
    expect(before).not.toBeNull();
    release();
    await page.waitForLoadState('networkidle');
    const after = await page.locator('#tool').boundingBox();
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
  } finally {
    release();
  }
});

test('failed route chunk shows recovery and reload restores the actual tool', async ({
  page
}) => {
  const chunk = await splitPdfChunk();
  let failed = false;
  await page.route(`**/assets/${chunk}`, (route) => {
    if (!failed) {
      failed = true;
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/pdf/split-pdf');
  await expect(page.getByRole('alert')).toContainText(
    'Unable to load this page'
  );
  await page.getByRole('link', { name: 'About', exact: true }).first().click();
  await expect(
    page.getByRole('heading', { name: 'About Orvulix', exact: true })
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('alert')).toContainText(
    'Unable to load this page'
  );
  await page.getByRole('button', { name: 'Reload page', exact: true }).click();
  await expect(page.locator('input[type=file]')).toBeAttached();
  await expect(
    page.getByRole('heading', { name: 'Split PDF', exact: true })
  ).toBeVisible();
});

test('explicit theme survives system changes and mobile controls work by keyboard', async ({
  page
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('input[role=combobox]')).toBeVisible();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(248, 250, 252)'
  );
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const theme = page.getByRole('button', { name: 'Color theme: light' });
  await theme.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Color theme: dark' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Color theme: dark' })
  ).toBeFocused();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(28, 31, 32)'
  );
});
