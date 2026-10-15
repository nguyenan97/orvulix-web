import { expect, test, Page } from '@playwright/test';
import { readFile, cp, mkdir } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import Jimp from 'jimp';
test.beforeAll(async () => {
  await mkdir('dist/__test-ffmpeg', { recursive: true });
  await mkdir('dist/__test-core', { recursive: true });
  await cp('node_modules/@ffmpeg/ffmpeg/dist/esm', 'dist/__test-ffmpeg', {
    recursive: true
  });
  await cp('node_modules/@ffmpeg/core/dist/esm', 'dist/__test-core', {
    recursive: true
  });
});
interface Fixture {
  name: string;
  mimeType: string;
  buffer: Buffer;
}
async function drop(page: Page, files: Fixture[]) {
  const transfer = await page.evaluateHandle(
    (items) => {
      const data = new DataTransfer();
      for (const item of items)
        data.items.add(
          new File(
            [Uint8Array.from(atob(item.bytes), (c) => c.charCodeAt(0))],
            item.name,
            { type: item.type }
          )
        );
      return data;
    },
    files.map((f) => ({
      name: f.name,
      type: f.mimeType,
      bytes: f.buffer.toString('base64')
    }))
  );
  await page
    .getByRole('region', { name: 'File drop zone' })
    .dispatchEvent('drop', { dataTransfer: transfer });
  await transfer.dispose();
  await expect(
    page.getByRole('region', { name: 'File drop zone' })
  ).toHaveAttribute('aria-busy', 'false');
}
async function download(page: Page) {
  const button = page.getByRole('button', { name: 'Download', exact: true });
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(button).toBeEnabled();
  const path = new URL(page.url()).pathname;
  const names: Record<string, string> = {
    '/pdf/convert-to-pdf': 'merged-images.pdf',
    '/pdf/merge-pdf': 'merged.pdf',
    '/audio/merge-audio': 'merged_audio.wav',
    '/video/merge-video': 'red_merged_with_1_videos.mp4'
  };
  const pending = page.waitForEvent('download', {
    predicate: (download) => download.suggestedFilename() === names[path]
  });
  await button.click();
  return readFile((await (await pending).path())!);
}
async function png(name: string, color: number): Promise<Fixture> {
  return {
    name,
    mimeType: 'image/png',
    buffer: await new Jimp(40, 30, color).getBufferAsync(Jimp.MIME_PNG)
  };
}
async function pdf(name: string, width: number): Promise<Fixture> {
  const doc = await PDFDocument.create();
  doc.addPage([width, 200]);
  return {
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.from(await doc.save())
  };
}
function wav(name: string, frequency: number): Fixture {
  const rate = 8000,
    samples = 1600,
    b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF');
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    b.writeInt16LE(
      Math.round(Math.sin((2 * Math.PI * frequency * i) / rate) * 12000),
      44 + i * 2
    );
  return { name, mimeType: 'audio/wav', buffer: b };
}
async function core(page: Page) {
  // Deterministic real installed WASM engine, not a stubbed conversion result.
  await page.route(
    'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/**',
    async (route) => {
      const url = new URL(route.request().url());
      const name = url.pathname.endsWith('.wasm')
        ? 'ffmpeg-core.wasm'
        : 'ffmpeg-core.js';
      await route.fulfill({
        path: `node_modules/@ffmpeg/core/dist/esm/${name}`,
        contentType: name.endsWith('.wasm')
          ? 'application/wasm'
          : 'text/javascript',
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  );
}
test('image picker/drop parity, mixed batch rejection, accessible remove/reset and real PDF', async ({
  page
}) => {
  await page.goto('/pdf/convert-to-pdf');
  const red = await png('red.png', 0xff0000ff),
    blue = await png('blue.png', 0x0000ffff);
  await page.locator('input[type=file]').setInputFiles(red);
  await expect(
    page.getByRole('img', { name: 'red.png', exact: true })
  ).toBeVisible();
  await drop(page, [
    blue,
    { name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') }
  ]);
  await expect(page.getByRole('alert')).toContainText('No files');
  await expect(
    page.getByRole('img', { name: 'blue.png', exact: true })
  ).toHaveCount(0);
  await drop(page, [blue]);
  await expect(
    page.getByRole('img', { name: 'blue.png', exact: true })
  ).toBeVisible();
  const exported = await download(page);
  const doc = await PDFDocument.load(exported, {
    updateMetadata: false
  });
  expect(doc.getPageCount()).toBe(2);
  expect(doc.getPages().map((p) => p.getWidth())).toEqual([
    expect.closeTo(30, 0),
    expect.closeTo(30, 0)
  ]);
  await page
    .getByRole('button', { name: 'Delete file', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('img', { name: 'red.png', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(
    page.getByRole('img', { name: 'blue.png', exact: true })
  ).toHaveCount(0);
  const select = page.getByRole('button', {
    name: 'Select files',
    exact: true
  });
  const chooser = page.waitForEvent('filechooser');
  // Keep keyboard activation targeted if an asynchronous PDF preview moves focus.
  await select.press('Enter');
  await (await chooser).setFiles(red);
  await expect(
    page.getByRole('img', { name: 'red.png', exact: true })
  ).toBeVisible();
  // Isolate exported-PDF verification from source-tab PDF preview downloads.
  const viewer = await page.context().newPage();
  await viewer.goto('/pdf/pdf-to-png');
  await viewer.locator('input[type=file]').setInputFiles({
    name: 'result.pdf',
    mimeType: 'application/pdf',
    buffer: exported
  });
  const previews = viewer.locator('img[alt^="Preview "]');
  await expect(previews).toHaveCount(2);
  const colors = [];
  for (let i = 0; i < 2; i++)
    colors.push(
      await previews.nth(i).evaluate(async (element) => {
        const img = element as HTMLImageElement;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const x = c.getContext('2d')!;
        x.drawImage(img, 0, 0);
        return [
          ...x.getImageData(
            Math.floor(c.width / 2),
            Math.floor(c.height / 2),
            1,
            1
          ).data
        ];
      })
    );
  expect(colors[0]).toEqual([255, 0, 0, 255]);
  expect(colors[1]).toEqual([0, 0, 255, 255]);
  await viewer.close();
});
test('PDF picker/drop preserve page order, reject malformed input and recover after clear', async ({
  page
}) => {
  await page.goto('/pdf/merge-pdf');
  await page
    .locator('input[type=file]')
    .setInputFiles(await pdf('first.pdf', 100));
  await drop(page, [await pdf('second.pdf', 150)]);
  const doc = await PDFDocument.load(await download(page), {
    updateMetadata: false
  });
  expect(doc.getPages().map((p) => p.getWidth())).toEqual([100, 150]);
  await drop(page, [
    {
      name: 'broken.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('not pdf')
    }
  ]);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Delete file', exact: true })
  ).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await drop(page, [await pdf('recovered.pdf', 175)]);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(
    (await PDFDocument.load(await download(page))).getPage(0).getWidth()
  ).toBe(175);
});
test('audio picker/drop run real FFmpeg and decode the resulting WAV', async ({
  page
}) => {
  await core(page);
  await page.goto('/audio/merge-audio');
  await page.getByLabel('WAV', { exact: true }).check();
  await page.locator('input[type=file]').setInputFiles(wav('first.wav', 440));
  await drop(page, [wav('second.wav', 880)]);
  await page.locator('audio[src^="blob:"]').waitFor({ state: 'attached' });
  const bytes = await download(page);
  const result = await page.evaluate(async (data) => {
    const ctx = new AudioContext();
    try {
      const b = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const audio = await ctx.decodeAudioData(b.buffer);
      const samples = audio.getChannelData(0);
      const crossings = (a: number, z: number) => {
        let n = 0;
        for (
          let i = Math.floor(a * audio.sampleRate) + 1;
          i < Math.floor(z * audio.sampleRate);
          i++
        )
          if (samples[i - 1] < 0 && samples[i] >= 0) n++;
        return n;
      };
      return {
        duration: audio.duration,
        first: crossings(0.02, 0.18),
        second: crossings(0.22, 0.38)
      };
    } finally {
      await ctx.close();
    }
  }, bytes.toString('base64'));
  expect(result.duration).toBeCloseTo(0.4, 1);
  expect(result.first).toBeGreaterThan(60);
  expect(result.second).toBeGreaterThan(result.first * 1.7);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Delete file', exact: true })
  ).toHaveCount(0);
});
test('video picker/drop run real FFmpeg and decode ordered red/blue frames', async ({
  page
}) => {
  await core(page);
  await page.goto('/video/merge-video');
  await page.locator('input[type=file]').setInputFiles({
    name: 'red.mp4',
    mimeType: 'video/mp4',
    buffer: await readFile('src/features/multifile-drop/fixtures/red.mp4')
  });
  await drop(page, [
    {
      name: 'blue.mp4',
      mimeType: 'video/mp4',
      buffer: await readFile('src/features/multifile-drop/fixtures/blue.mp4')
    }
  ]);
  await page.locator('video[src^="blob:"]').waitFor({ state: 'attached' });
  const bytes = await download(page);
  const result = await page.evaluate(async (data) => {
    // Real H.264 decoding on engines whose native codec build may lack support.
    const modulePath = '/__test-ffmpeg/index.js';
    const { FFmpeg } = (await import(
      /* @vite-ignore */ modulePath
    )) as typeof import('@ffmpeg/ffmpeg');
    const engine = new FFmpeg();
    try {
      await engine.load({
        classWorkerURL: location.origin + '/__test-ffmpeg/worker.js',
        coreURL: location.origin + '/__test-core/ffmpeg-core.js',
        wasmURL: location.origin + '/__test-core/ffmpeg-core.wasm'
      });
      await engine.writeFile(
        'input.mp4',
        Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      );
      const colors = [];
      for (const [index, time] of [0.1, 0.4].entries()) {
        const name = `frame${index}.png`;
        const exit = await engine.exec([
          '-ss',
          String(time),
          '-i',
          'input.mp4',
          '-frames:v',
          '1',
          name
        ]);
        if (exit !== 0) throw Error('MP4 frame decoding failed');
        const pixels = await engine.readFile(name);
        const blob = new Blob([new Uint8Array(pixels as Uint8Array)], {
          type: 'image/png'
        });
        const image = await createImageBitmap(blob);
        const c = document.createElement('canvas');
        c.width = image.width;
        c.height = image.height;
        const x = c.getContext('2d')!;
        x.drawImage(image, 0, 0);
        colors.push([...x.getImageData(16, 16, 1, 1).data]);
        image.close();
      }
      return { colors };
    } finally {
      engine.terminate();
    }
  }, bytes.toString('base64'));
  const header = bytes.indexOf(Buffer.from('tkhd'));
  expect(header).toBeGreaterThan(0);
  const boxSize = bytes.readUInt32BE(header - 4);
  expect([
    bytes.readUInt32BE(header + boxSize - 12) / 65536,
    bytes.readUInt32BE(header + boxSize - 8) / 65536
  ]).toEqual([32, 32]);
  const movie = bytes.indexOf(Buffer.from('mvhd'));
  expect(movie).toBeGreaterThan(0);
  expect(
    bytes.readUInt32BE(movie + 20) / bytes.readUInt32BE(movie + 16)
  ).toBeCloseTo(0.6, 1);
  expect(result.colors[0][0]).toBeGreaterThan(200);
  expect(result.colors[0][2]).toBeLessThan(30);
  expect(result.colors[1][2]).toBeGreaterThan(200);
  expect(result.colors[1][0]).toBeLessThan(30);
});
test('nested drag state, empty files, count limits, mobile/dark layout and navigation recovery', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/pdf/convert-to-pdf');
  const zone = page.getByRole('region', { name: 'File drop zone' });
  const data = await page.evaluateHandle(() => {
    const d = new DataTransfer();
    d.items.add(new File(['x'], 'a.png', { type: 'image/png' }));
    return d;
  });
  await zone.dispatchEvent('dragenter', { dataTransfer: data });
  await zone
    .locator('[role=status]')
    .dispatchEvent('dragenter', { dataTransfer: data });
  await zone
    .locator('[role=status]')
    .dispatchEvent('dragleave', { dataTransfer: data });
  await expect(
    page.getByText('Drop files to import', { exact: true })
  ).toBeVisible();
  await zone.dispatchEvent('dragleave', { dataTransfer: data });
  await expect(
    page.getByText('Drop files to import', { exact: true })
  ).toHaveCount(0);
  await data.dispose();
  await drop(page, [
    { name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) }
  ]);
  await expect(page.getByRole('alert')).toContainText('non-empty');
  const red = await png('a.png', 0xff0000ff);
  await drop(
    page,
    Array.from({ length: 21 }, () => red)
  );
  await expect(page.getByRole('alert')).toContainText('20 files');
  await drop(page, [red]);
  await expect(
    page.getByRole('img', { name: 'a.png', exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.locator('a[href="/pdf/merge-pdf"]').first().click();
  await expect(page).toHaveURL(/\/pdf\/merge-pdf$/);
  await expect(page.getByRole('region')).toHaveAttribute('aria-busy', 'false');
  await drop(page, [await pdf('new.pdf', 100)]);
  expect((await PDFDocument.load(await download(page))).getPageCount()).toBe(1);
});
