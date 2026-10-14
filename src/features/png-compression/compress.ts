import imageCompression from 'browser-image-compression';
import workerScript from 'browser-image-compression/dist/browser-image-compression.js?url';

export const PNG_LIMITS = {
  bytes: 16 * 1024 * 1024,
  side: 4096,
  pixels: 8_000_000,
  chunks: 512
} as const;

/** Geometry/chunk preflight only; the image decoder validates actual pixels. */
export function inspectPng(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length > PNG_LIMITS.bytes)
    throw Error('PNG must be at most 16 MiB.');
  if (bytes.length < 33 || signature.some((value, i) => bytes[i] !== value))
    throw Error('Choose a valid static PNG file.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8,
    count = 0,
    width = 0,
    height = 0,
    data = false;
  while (offset < bytes.length) {
    if (++count > PNG_LIMITS.chunks || offset + 12 > bytes.length)
      throw Error('PNG has excessive or truncated chunks.');
    const length = view.getUint32(offset);
    const kind = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (offset + length + 12 > bytes.length)
      throw Error('PNG has a truncated chunk.');
    if (count === 1) {
      if (kind !== 'IHDR' || length !== 13)
        throw Error('PNG has an invalid header.');
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      if (
        !width ||
        !height ||
        width > PNG_LIMITS.side ||
        height > PNG_LIMITS.side ||
        width * height > PNG_LIMITS.pixels
      )
        throw Error(
          'PNG must be at most 4096 pixels per side and 8 megapixels.'
        );
    } else if (kind === 'IHDR') throw Error('PNG has a duplicate header.');
    if (kind === 'acTL')
      throw Error('Animated PNG is not supported. Choose a static PNG.');
    if (kind === 'IDAT') data = true;
    offset += length + 12;
    if (kind === 'IEND') {
      if (length || !data || offset !== bytes.length)
        throw Error('PNG has an invalid ending.');
      return { width, height };
    }
  }
  throw Error('PNG is missing its ending.');
}

export async function compressPng(
  file: File,
  quality: number,
  signal: AbortSignal
): Promise<File> {
  signal.throwIfAborted();
  if (!Number.isInteger(quality) || quality < 1 || quality > 100)
    throw Error('Palette quality must be an integer from 1 to 100.');
  if (file.size > PNG_LIMITS.bytes) throw Error('PNG must be at most 16 MiB.');
  const geometry = inspectPng(new Uint8Array(await file.arrayBuffer()));
  signal.throwIfAborted();
  const png =
    file.type === 'image/png'
      ? file
      : new File([file], file.name, {
          type: 'image/png',
          lastModified: file.lastModified
        });
  const result = await imageCompression(png, {
    maxSizeMB: 1,
    initialQuality: quality / 100,
    alwaysKeepResolution: true,
    useWebWorker: true,
    libURL: new URL(workerScript, window.location.href).href,
    signal
  });
  signal.throwIfAborted();
  if (result.size >= file.size) return png;
  const output = inspectPng(new Uint8Array(await result.arrayBuffer()));
  signal.throwIfAborted();
  if (geometry.width !== output.width || geometry.height !== output.height)
    throw Error(
      'This PNG cannot be compressed without changing its dimensions.'
    );
  return new File([result], file.name, {
    type: 'image/png',
    lastModified: file.lastModified
  });
}
