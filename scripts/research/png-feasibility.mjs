// Experimental benchmark, deliberately outside the application/runtime graph.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { chromium, firefox, webkit } from 'playwright';
import Jimp from 'jimp';
import {
  fixtures,
  idat,
  filtered,
  replaceIdat,
  nonIdat,
  chunks
} from './png-fixtures.mjs';

const outputIndex = process.argv.indexOf('--output');
if (outputIndex < 0 || !process.argv[outputIndex + 1])
  throw Error(
    'Pass --output <local report.json>; no benchmark files are written by default.'
  );
const output = resolve(process.argv[outputIndex + 1]);
const samples = 3;
const inputLimit = 4 * 1024 * 1024;
const inflatedLimit = 32 * 1024 * 1024;
const deadlineMs = 10_000;
async function boundedEvaluate(page, callback, args) {
  let timer;
  try {
    return await Promise.race([
      page.evaluate(callback, args),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(Error('Browser operation exceeded 15 seconds')),
          15_000
        );
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
const bundle = await readFile(
  new URL(
    '../../node_modules/browser-image-compression/dist/browser-image-compression.js',
    import.meta.url
  )
);
const libraryPackage = JSON.parse(
  await readFile(
    new URL(
      '../../node_modules/browser-image-compression/package.json',
      import.meta.url
    ),
    'utf8'
  )
);
const server = createServer((req, res) => {
  if (req.url === '/library.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(bundle);
  } else if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><title>Local PNG research</title>');
  } else {
    res.statusCode = 404;
    res.end();
  }
});
const report = {
  schema: 1,
  complete: false,
  generatedAt: new Date().toISOString(),
  node: process.version,
  library: {
    version: libraryPackage.version,
    license: libraryPackage.license,
    sha256: createHash('sha256').update(bundle).digest('hex')
  },
  limits: { inputLimit, inflatedLimit, deadlineMs, samples },
  timing:
    'Median of 3 sequential runs, including first/cold run. Different candidate operations; see feasibility doc.',
  results: [],
  controls: []
};
let browser;
try {
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', accept);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const engine of [chromium, firefox, webkit]) {
    browser = await engine.launch();
    const page = await browser.newPage();
    const external = [];
    await page.route('**/*', async (route) => {
      if (new URL(route.request().url()).origin === origin)
        await route.continue();
      else {
        external.push(route.request().url());
        await route.abort();
      }
    });
    await page.goto(origin);
    await page.addScriptTag({ url: `${origin}/library.js` });
    // Establish bounded worker execution once. Inputs are generated locally.
    await page.evaluate(() => {
      window.runStream = (bytes, limit, deadline, mode = 'deflate') =>
        new Promise((accept, reject) => {
          const source = `onmessage = async ({data: {bytes, limit, mode}}) => {
          try {
            if (mode === 'stall') return;
            const read = async (stream) => {
              const reader = stream.getReader(), parts = []; let size = 0;
              try { while (true) {
                const {done, value} = await reader.read(); if (done) break;
                size += value.length;
                if (size > limit) throw Error('Stream exceeds output budget');
                parts.push(value);
              }} finally { await reader.cancel(); }
              const out = new Uint8Array(size); let offset = 0;
              for (const part of parts) { out.set(part, offset); offset += part.length; }
              return out;
            };
            const raw = await read(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')));
            const encoded = await read(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate')));
            postMessage({bytes: encoded}, [encoded.buffer]);
          } catch (error) { postMessage({error: String(error.message || error)}); }
        }`;
          const url = URL.createObjectURL(
            new Blob([source], { type: 'text/javascript' })
          );
          let worker, timer;
          const cleanup = () => {
            clearTimeout(timer);
            worker?.terminate();
            URL.revokeObjectURL(url);
          };
          try {
            worker = new Worker(url);
            worker.onmessage = ({ data }) => {
              cleanup();
              if (data.error) reject(Error(data.error));
              else accept(Array.from(data.bytes));
            };
            worker.onerror = () => {
              cleanup();
              reject(Error('Worker failed'));
            };
            timer = setTimeout(() => {
              cleanup();
              reject(Error('Worker deadline exceeded'));
            }, deadline);
            worker.postMessage({ bytes: new Uint8Array(bytes), limit, mode });
          } catch (error) {
            cleanup();
            reject(error);
          }
        });
    });
    for (const fixture of fixtures()) {
      if (fixture.png.length > inputLimit)
        throw Error('Fixture exceeds input budget');
      const original = await Jimp.read(fixture.png);
      if (
        original.bitmap.width !== fixture.width ||
        original.bitmap.height !== fixture.height
      )
        throw Error('Fixture geometry disagrees with independent decoder');
      for (const candidate of [
        'library-quality100',
        'native-canvas',
        'native-idat'
      ]) {
        const times = [];
        let row;
        for (let sample = 0; sample < samples; sample++) {
          const compressed =
            candidate === 'native-idat' ? idat(fixture.png) : fixture.png;
          const start = performance.now();
          const encoded = await boundedEvaluate(
            page,
            async ({ candidate, bytes, deadlineMs, inflatedLimit }) => {
              if (candidate === 'native-idat')
                return window.runStream(bytes, inflatedLimit, deadlineMs);
              const file = new File([new Uint8Array(bytes)], 'fixture.png', {
                type: 'image/png'
              });
              if (candidate === 'library-quality100') {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), deadlineMs);
                try {
                  const result = await window.imageCompression(file, {
                    useWebWorker: false,
                    alwaysKeepResolution: true,
                    initialQuality: 1,
                    maxIteration: 1,
                    signal: controller.signal
                  });
                  return Array.from(new Uint8Array(await result.arrayBuffer()));
                } finally {
                  clearTimeout(timer);
                }
              }
              const image = new Image();
              const url = URL.createObjectURL(file);
              let canvas;
              try {
                image.src = url;
                await image.decode();
                canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                canvas.getContext('2d').drawImage(image, 0, 0);
                const blob = await new Promise((accept, reject) =>
                  canvas.toBlob(
                    (value) =>
                      value
                        ? accept(value)
                        : reject(Error('Canvas encoding failed')),
                    'image/png'
                  )
                );
                return Array.from(new Uint8Array(await blob.arrayBuffer()));
              } finally {
                URL.revokeObjectURL(url);
                if (canvas) canvas.width = canvas.height = 0;
              }
            },
            {
              candidate,
              bytes: Array.from(compressed),
              deadlineMs,
              inflatedLimit
            }
          );
          times.push(performance.now() - start);
          const result =
            candidate === 'native-idat'
              ? replaceIdat(fixture.png, Buffer.from(encoded))
              : Buffer.from(encoded);
          const decoded = await Jimp.read(result);
          const geometryEqual =
            decoded.bitmap.width === original.bitmap.width &&
            decoded.bitmap.height === original.bitmap.height;
          const rgba8Equal =
            geometryEqual && decoded.bitmap.data.equals(original.bitmap.data);
          const filteredBytesEqual = filtered(result).equals(
            filtered(fixture.png)
          );
          const nonIdatEqual = nonIdat(result).equals(nonIdat(fixture.png));
          const selected =
            result.length < fixture.png.length ? result : fixture.png;
          if (selected.length > fixture.png.length)
            throw Error('Inflation selection failed');
          if (
            candidate === 'native-idat' &&
            !(geometryEqual && rgba8Equal && filteredBytesEqual && nonIdatEqual)
          )
            throw Error('Stream candidate violated exact preservation');
          row = {
            browser: engine.name(),
            browserVersion: browser.version(),
            fixture: fixture.name,
            candidate,
            inputBytes: fixture.png.length,
            candidateBytes: result.length,
            selectedBytes: selected.length,
            keptOriginal: selected === fixture.png,
            geometryEqual,
            rgba8Equal,
            filteredBytesEqual,
            nonIdatEqual,
            inputChunks: chunks(fixture.png).map((c) => c.type),
            outputChunks: chunks(result).map((c) => c.type),
            sourceSha256: createHash('sha256').update(fixture.png).digest('hex')
          };
        }
        row.elapsedMs = times;
        row.medianMs = [...times].sort((a, b) => a - b)[1];
        report.results.push(row);
        console.log(
          `${row.browser} ${row.fixture} ${row.candidate}: ${row.inputBytes}->${
            row.candidateBytes
          }, rgba8=${row.rgba8Equal}, exact=${
            row.filteredBytesEqual && row.nonIdatEqual
          }`
        );
      }
    }
    for (const [name, limit, mode] of [
      ['expanded-budget', 16, 'deflate'],
      ['deadline', inflatedLimit, 'stall']
    ]) {
      const error = await page.evaluate(
        async ({ bytes, limit, deadlineMs, mode }) => {
          try {
            await window.runStream(bytes, limit, deadlineMs, mode);
            return null;
          } catch (error) {
            return error.message;
          }
        },
        {
          bytes: Array.from(idat(fixtures()[0].png)),
          limit,
          deadlineMs: mode === 'stall' ? 50 : deadlineMs,
          mode
        }
      );
      if (!error?.includes(name === 'deadline' ? 'deadline' : 'budget'))
        throw Error(`Missing ${name} control`);
      report.controls.push({ browser: engine.name(), name, error });
    }
    // A fresh worker must succeed after both failed executions.
    const recovered = await page.evaluate(
      ({ bytes, inflatedLimit, deadlineMs }) =>
        window.runStream(bytes, inflatedLimit, deadlineMs),
      { bytes: Array.from(idat(fixtures()[0].png)), inflatedLimit, deadlineMs }
    );
    if (
      !filtered(replaceIdat(fixtures()[0].png, Buffer.from(recovered))).equals(
        filtered(fixtures()[0].png)
      )
    )
      throw Error('Worker recovery changed data');
    if (external.length) throw Error('Unexpected non-loopback network attempt');
    report.controls.push({
      browser: engine.name(),
      name: 'recovery-and-network',
      recovered: true,
      externalRequests: 0
    });
    await browser.close();
    browser = undefined;
  }
  report.complete = true;
} catch (error) {
  report.failure = error.message;
  throw error;
} finally {
  try {
    await browser?.close();
  } finally {
    await new Promise((accept, reject) =>
      server.close((error) => (error ? reject(error) : accept()))
    );
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  }
}
console.log(`Wrote ${report.results.length} measured rows to ${output}`);
