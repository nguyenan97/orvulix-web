import { abortError, checkAbort } from './model';

export const ASSET_LIMITS = {
  count: 4,
  bytes: 48 * 1024,
  dimension: 1024,
  pixels: 500_000,
  totalPixels: 1_000_000,
  timeoutMs: 5000
} as const;
export interface EmbeddedImage {
  mime: 'image/png' | 'image/jpeg';
  dataUrl: string;
  bytes: Uint8Array;
  width: number;
  height: number;
}
function dimensions(width: number, height: number) {
  if (
    !width ||
    !height ||
    width > ASSET_LIMITS.dimension ||
    height > ASSET_LIMITS.dimension ||
    width * height > ASSET_LIMITS.pixels
  )
    throw Error(
      'Embedded images must be at most 1024 px per side and 500000 pixels each.'
    );
}
function crc32(bytes: Uint8Array, start: number, end: number) {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngSize(bytes: Uint8Array) {
  if (![137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte))
    throw Error('Invalid embedded PNG signature.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8,
    width = 0,
    height = 0,
    data = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    if (length > bytes.length - offset - 12)
      throw Error('Embedded PNG is truncated.');
    const kind = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (
      ![
        'IHDR',
        'PLTE',
        'IDAT',
        'IEND',
        'tRNS',
        'sRGB',
        'gAMA',
        'cHRM',
        'pHYs',
        'tEXt'
      ].includes(kind)
    )
      throw Error(
        'Embedded PNG contains animation or unsupported metadata. Use a plain static PNG.'
      );
    if (kind === 'IHDR') {
      if (offset !== 8 || length !== 13 || width)
        throw Error('Invalid embedded PNG header.');
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      dimensions(width, height); // Reject pixel bombs before any browser decode.
      if (![1, 2, 4, 8].includes(bytes[offset + 16]))
        throw Error('Use an 8-bit or lower embedded PNG.');
    } else if (!width) throw Error('Embedded PNG has no image header.');
    if (
      crc32(bytes, offset + 4, offset + 8 + length) !==
      view.getUint32(offset + 8 + length)
    )
      throw Error('Embedded PNG checksum is invalid.');
    offset += length + 12;
    if (kind === 'IDAT') data = true;
    if (kind === 'IEND') {
      if (length || !data || offset !== bytes.length)
        throw Error('Invalid embedded PNG ending.');
      return { width, height };
    }
  }
  throw Error('Embedded PNG is incomplete.');
}
function jpegSize(bytes: Uint8Array) {
  if (bytes[0] !== 255 || bytes[1] !== 216)
    throw Error('Invalid embedded JPEG signature.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2,
    width = 0,
    height = 0,
    scan = false,
    sawScan = false;
  while (offset < bytes.length) {
    if (scan && bytes[offset] !== 255) {
      offset++;
      continue;
    }
    if (bytes[offset++] !== 255) throw Error('Invalid embedded JPEG marker.');
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (scan && (marker === 0 || (marker >= 0xd0 && marker <= 0xd7))) continue;
    if (marker === 0xd9) {
      if (!width || !sawScan || offset !== bytes.length)
        throw Error('Invalid embedded JPEG ending.');
      return { width, height };
    }
    scan = false;
    if (marker === undefined || offset + 2 > bytes.length)
      throw Error('Embedded JPEG is truncated.');
    const length = view.getUint16(offset);
    if (length < 2 || offset + length > bytes.length)
      throw Error('Invalid embedded JPEG segment.');
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      if (
        ![0xc0, 0xc2].includes(marker) ||
        width ||
        length < 8 ||
        bytes[offset + 2] !== 8
      )
        throw Error('Use a single-frame baseline or progressive 8-bit JPEG.');
      height = view.getUint16(offset + 3);
      width = view.getUint16(offset + 5);
      dimensions(width, height);
    }
    if (marker === 0xda) {
      if (!width) throw Error('Embedded JPEG has no image header.');
      scan = sawScan = true;
    }
    offset += length;
  }
  throw Error('Embedded JPEG is incomplete.');
}
/** Unsupported sources are removed, malformed supported data is a visible error. */
export function readEmbeddedImage(source: string): EmbeddedImage | null {
  const match = source.match(/^data:image\/(png|jpeg);base64,([\s\S]*)$/i);
  if (!match) return null;
  const base64 = match[2].replace(/\s/g, '');
  if (!base64 || base64.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
    throw Error('Invalid embedded image base64.');
  if ((base64.length / 4) * 3 > ASSET_LIMITS.bytes + 2)
    throw Error('Embedded image data exceeds 48 KiB.');
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw Error('Invalid embedded image base64.');
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (bytes.length > ASSET_LIMITS.bytes)
    throw Error('Embedded image data exceeds 48 KiB.');
  const mime = match[1].toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
  return {
    mime,
    bytes,
    dataUrl: `data:${mime};base64,${base64}`,
    ...(mime === 'image/png' ? pngSize(bytes) : jpegSize(bytes))
  };
}
export function checkAssetTotals(assets: readonly EmbeddedImage[]) {
  if (assets.length > ASSET_LIMITS.count)
    throw Error('Use at most 4 embedded images.');
  if (
    assets.reduce((total, asset) => total + asset.bytes.length, 0) >
    ASSET_LIMITS.bytes
  )
    throw Error('Combined embedded image data exceeds 48 KiB.');
  if (
    assets.reduce((total, asset) => total + asset.width * asset.height, 0) >
    ASSET_LIMITS.totalPixels
  )
    throw Error('Embedded images exceed the 1000000 total pixel limit.');
}
interface Bitmap {
  width: number;
  height: number;
  close(): void;
}
type Decoder = (blob: Blob) => Promise<Bitmap>;
const decode: Decoder = (blob) => {
  if (typeof createImageBitmap !== 'function')
    throw Error('This browser cannot safely decode embedded images.');
  return createImageBitmap(blob);
};
/** One phase deadline; native decode itself is not preemptible. Always close bitmaps. */
export async function validateEmbeddedImages(
  assets: readonly EmbeddedImage[],
  signal: AbortSignal,
  decoder: Decoder = decode
) {
  checkAbort(signal);
  checkAssetTotals(assets);
  if (!assets.length) return;
  if (decoder === decode && typeof createImageBitmap !== 'function')
    throw Error('This browser cannot safely decode embedded images.');
  let active = true,
    timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = performance.now() + ASSET_LIMITS.timeoutMs;
  const timeoutError = () =>
    Error('Embedded image decoding timed out. Use smaller images.');
  const checkActive = () => {
    checkAbort(signal);
    if (!active) throw abortError();
    if (performance.now() > deadline) throw timeoutError();
  };
  let removeAbort = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener('abort', abort, { once: true });
    removeAbort = () => signal.removeEventListener('abort', abort);
    timer = setTimeout(() => reject(timeoutError()), ASSET_LIMITS.timeoutMs);
  });
  const work = async () => {
    for (const asset of assets) {
      checkActive();
      let bitmap: Bitmap;
      try {
        bitmap = await decoder(
          new Blob([new Uint8Array(asset.bytes).buffer], { type: asset.mime })
        );
      } catch {
        checkActive();
        throw Error(
          'Embedded image could not be decoded. Use a valid PNG or JPEG.'
        );
      }
      try {
        checkActive();
        dimensions(bitmap.width, bitmap.height);
        const expected =
          bitmap.width === asset.width && bitmap.height === asset.height;
        const oriented =
          asset.mime === 'image/jpeg' &&
          bitmap.width === asset.height &&
          bitmap.height === asset.width;
        if (!expected && !oriented)
          throw Error('Embedded image dimensions do not match its header.');
      } finally {
        bitmap.close();
      }
    }
    checkActive();
  };
  try {
    await Promise.race([work(), interrupted]);
  } finally {
    active = false;
    clearTimeout(timer);
    removeAbort();
  }
}
