import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const prefix = process.env.PLAYWRIGHT_BASE_PATH?.replace(/\/$/, '') ?? '';
const route = `${prefix}/image-generic/batch-ocr`;
async function image(page: Page, text: string, mime = 'image/png') {
  const base64 = await page.evaluate(
    ({ text, mime }) => {
      const c = document.createElement('canvas');
      c.width = 1000;
      c.height = 180;
      const x = c.getContext('2d')!;
      x.fillStyle = 'white';
      x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = 'black';
      x.font = '48px sans-serif';
      x.fillText(text, 30, 100);
      return c.toDataURL(mime).split(',')[1];
    },
    { text, mime }
  );
  return Buffer.from(base64, 'base64');
}
async function chooseLanguage(page: Page, name: string) {
  await page.getByRole('combobox', { name: 'OCR language' }).click();
  await page.getByRole('option', { name, exact: true }).click();
}
test('real English/Vietnamese PNG and JPEG produce ordered TXT and independently decoded ZIP without upload', async ({
  page
}) => {
  test.setTimeout(90_000);
  const models: string[] = [],
    posts: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('traineddata')) models.push(r.url());
    if (r.method() !== 'GET') posts.push(r.url());
  });
  await page.goto(route);
  await page.getByLabel('Choose OCR images').setInputFiles([
    {
      name: 'second.png',
      mimeType: 'image/png',
      buffer: await image(page, 'Xin chào Việt Nam')
    },
    {
      name: 'first.jpg',
      mimeType: 'image/jpeg',
      buffer: await image(page, 'HELLO ORVULIX', 'image/jpeg')
    }
  ]);
  expect(models).toEqual([]);
  await chooseLanguage(page, 'English + Vietnamese');
  expect(models).toEqual([]);
  await page.getByRole('button', { name: 'Run OCR', exact: true }).click();
  const zipLink = page.getByRole('link', { name: 'Download ZIP' });
  await expect(zipLink).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Text 1: second.png')).toHaveValue(
    /Xin chào Việt Nam/
  );
  await expect(page.getByLabel('Text 2: first.jpg')).toHaveValue(
    /HELLO ORVULIX/
  );
  const zipEvent = page.waitForEvent('download');
  await zipLink.click();
  const zip = await readFile((await (await zipEvent).path())!);
  const decoded = JSON.parse(
    execFileSync(
      'python3',
      [
        '-c',
        'import sys,io,zipfile,json; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); print(json.dumps({n:z.read(n).decode("utf-8") for n in z.namelist()}))'
      ],
      { input: zip }
    ).toString()
  );
  expect(Object.keys(decoded)).toEqual(['001-second.txt', '002-first.txt']);
  expect(decoded['001-second.txt']).toContain('Xin chào Việt Nam');
  expect(decoded['002-first.txt']).toContain('HELLO ORVULIX');
  const txtEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download TXT' }).click();
  const txt = await readFile((await (await txtEvent).path())!, 'utf8');
  expect(txt.indexOf('second.png')).toBeLessThan(txt.indexOf('first.jpg'));
  expect(txt).toContain('Xin chào Việt Nam');
  expect(models.some((url) => url.includes('/vie@1.0.0/'))).toBe(true);
  expect(models.some((url) => url.includes('/eng@1.0.0/'))).toBe(true);
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(zipLink).toHaveCount(0);
});
test('cancels during model startup, removes owned workers, and recovers from network failure', async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const Native = window.Worker;
    const audit = { started: 0, stopped: 0 };
    Object.assign(window, { ocrAudit: audit });
    window.Worker = class extends Native {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        audit.started++;
      }
      terminate() {
        audit.stopped++;
        super.terminate();
      }
    };
  });
  let requested!: () => void;
  const request = new Promise<void>((r) => {
    requested = r;
  });
  let release!: () => void;
  const held = new Promise<void>((r) => {
    release = r;
  });
  await page.route('**/*traineddata.gz', async (r) => {
    requested();
    await held;
    await r.abort();
  });
  await page.goto(route);
  await page.getByLabel('Choose OCR images').setInputFiles({
    name: 'cancel.png',
    mimeType: 'image/png',
    buffer: await image(page, 'HELLO ORVULIX')
  });
  await chooseLanguage(page, 'English');
  await page.getByRole('button', { name: 'Run OCR', exact: true }).click();
  await request;
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  release();
  await expect(
    page.getByRole('status').filter({ hasText: 'OCR cancelled' })
  ).toBeVisible();
  const audit = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            ocrAudit: { started: number; stopped: number };
          }
        ).ocrAudit
    );
  expect(await audit()).toEqual({ started: 1, stopped: 1 });
  await expect(page.getByRole('link', { name: 'Download TXT' })).toHaveCount(0);
  await page.unroute('**/*traineddata.gz');
  await page.route('**/*traineddata.gz', (r) => r.abort());
  await page.getByRole('button', { name: 'Run OCR', exact: true }).click();
  await expect(page.getByText(/OCR could not process this batch/)).toBeVisible({
    timeout: 20_000
  });
  expect(await audit()).toEqual({ started: 2, stopped: 2 });
  await page.unroute('**/*traineddata.gz');
  await page.getByRole('button', { name: 'Run OCR', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download ZIP' })).toBeVisible({
    timeout: 60_000
  });
  expect(await audit()).toEqual({ started: 4, stopped: 4 });
});
test('rejects geometry/corrupt files, supports keyboard/mobile and discards results on language change', async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await chooseLanguage(page, 'Vietnamese');
  const good = await image(page, 'Xin chào Việt Nam');
  const huge = Buffer.from(good);
  huge.writeUInt32BE(100_000, 16);
  const picker = page.getByLabel('Choose OCR images');
  await picker.setInputFiles({
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: huge
  });
  const run = page.getByRole('button', { name: 'Run OCR', exact: true });
  await run.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Maximum 4096 pixels/).last()).toBeVisible();
  await picker.setInputFiles({
    name: 'corrupt.png',
    mimeType: 'image/png',
    buffer: Buffer.from('bad')
  });
  await run.click();
  await expect(
    page.getByText('Choose a valid static PNG or JPEG image.')
  ).toBeVisible();
  const brokenPixels = Buffer.from(good);
  const idat = brokenPixels.indexOf(Buffer.from('IDAT'));
  expect(idat).toBeGreaterThan(0);
  brokenPixels[idat + 4] = 0;
  await picker.setInputFiles({
    name: 'broken-pixels.png',
    mimeType: 'image/png',
    buffer: brokenPixels
  });
  await run.click();
  await expect(page.getByText(/OCR could not process this batch/)).toBeVisible({
    timeout: 20_000
  });
  await picker.setInputFiles({
    name: 'valid.png',
    mimeType: 'image/png',
    buffer: good
  });
  await run.click();
  await expect(page.getByRole('link', { name: 'Download TXT' })).toBeVisible({
    timeout: 60_000
  });
  await page.screenshot({
    path: test.info().outputPath('batch-ocr-mobile.png')
  });
  await chooseLanguage(page, 'English');
  await expect(page.getByRole('link', { name: 'Download TXT' })).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});
