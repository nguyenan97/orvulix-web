// Rasterize the existing brand SVG without redesigning or changing its URL.
// Requires the project's existing Playwright dev dependency and Chromium.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile('public/favicon.svg', 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const render = async (size) =>
    Buffer.from(
      await page.evaluate(
        async ({ svg, size }) => {
          const image = new Image();
          image.src = 'data:image/svg+xml;base64,' + btoa(svg);
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          canvas.getContext('2d').drawImage(image, 0, 0, size, size);
          return canvas.toDataURL('image/png').split(',')[1];
        },
        { svg, size }
      ),
      'base64'
    );
  for (const [file, size] of [
    ['favicon.png', 64],
    ['favicon-96x96.png', 96],
    ['apple-touch-icon.png', 180],
    ['web-app-manifest-192x192.png', 192],
    ['web-app-manifest-512x512.png', 512]
  ])
    await writeFile('public/' + file, await render(size));
  // ICO container with a PNG entry, supported by modern browsers/Windows.
  const png = await render(64);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = header[7] = 64;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  await writeFile('public/favicon.ico', Buffer.concat([header, png]));
  console.log(
    'Generated Orvulix PNG/ICO assets from the unchanged favicon.svg.'
  );
} finally {
  await browser.close();
}
