import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

import { GifInputError } from './input-error';
export { GifInputError } from './input-error';
const MiB = 1024 * 1024;
export const MIXED_GIF_LIMITS = {
  frames: 20,
  inputFile: 16 * MiB,
  inputTotal: 64 * MiB,
  edge: 4096,
  framePixels: 4_000_000,
  totalPixels: 16_000_000,
  header: 256 * 1024,
  normalizedFile: 20 * MiB,
  normalizedTotal: 64 * MiB,
  output: 32 * MiB
} as const;
type Format = 'png' | 'jpeg';
type Geometry = { width: number; height: number };
function format(bytes: Uint8Array): Format | null {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b))
    return 'png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpeg';
  return null;
}
function invalid(): never {
  throw new GifInputError(
    'Invalid or unsupported mixed image. Use static PNG/JPEG with metadata within 256 KiB.'
  );
}
export function imageGeometry(bytes: Uint8Array, codec: Format): Geometry {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (format(bytes) !== codec) invalid();
  if (codec === 'png') {
    if (
      bytes.length < 33 ||
      view.getUint32(8) !== 13 ||
      view.getUint32(12) !== 0x49484452
    )
      invalid();
    let offset = 33;
    while (offset + 8 <= bytes.length) {
      const kind = view.getUint32(offset + 4);
      if (kind === 0x6163544c) invalid(); // APNG is not a static mixed frame.
      if (kind === 0x49444154)
        return { width: view.getUint32(16), height: view.getUint32(20) };
      offset += view.getUint32(offset) + 12;
    }
    invalid();
  }
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset++] !== 255) invalid();
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9 || marker === undefined) invalid();
    const length = offset + 2 <= bytes.length ? view.getUint16(offset) : 0;
    if (length < 2 || offset + length > bytes.length) invalid();
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8) invalid();
      return {
        width: view.getUint16(offset + 5),
        height: view.getUint16(offset + 3)
      };
    }
    offset += length;
  }
  return invalid();
}
function boundedGeometry({ width, height }: Geometry) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > MIXED_GIF_LIMITS.edge ||
    height > MIXED_GIF_LIMITS.edge ||
    width * height > MIXED_GIF_LIMITS.framePixels
  )
    throw new GifInputError(
      'Mixed PNG/JPEG frames must be at most 4096px per side and 4 megapixels. Resize the images.'
    );
}
/** Pure metadata policy; no allocation/decode claim based on MIME or filenames. */
export function checkMixedGeometry(frames: Geometry[]) {
  let pixels = 0;
  for (const frame of frames) {
    boundedGeometry(frame);
    pixels += frame.width * frame.height;
  }
  if (pixels > MIXED_GIF_LIMITS.totalPixels)
    throw new GifInputError(
      'Mixed PNG/JPEG images exceed 16 megapixels combined. Use fewer or smaller images.'
    );
}
type Context = { ffmpeg: FFmpeg; tempFile: (extension: string) => string };
export async function normalizeMixedGif(
  files: File[],
  { ffmpeg, tempFile }: Context,
  signal?: AbortSignal
): Promise<string[] | null> {
  const codecs: (Format | null)[] = [];
  for (const file of files) {
    signal?.throwIfAborted();
    codecs.push(format(new Uint8Array(await file.slice(0, 8).arrayBuffer())));
    signal?.throwIfAborted();
  }
  if (!codecs.includes('png') || !codecs.includes('jpeg')) return null;
  if (codecs.includes(null))
    throw new GifInputError(
      'Mixed conversion supports static PNG and JPEG only. Remove other image formats.'
    );
  if (
    files.length > MIXED_GIF_LIMITS.frames ||
    files.some((f) => f.size <= 0 || f.size > MIXED_GIF_LIMITS.inputFile) ||
    files.reduce((sum, f) => sum + f.size, 0) > MIXED_GIF_LIMITS.inputTotal
  )
    throw new GifInputError(
      'Mixed conversion allows 20 images, 16 MiB per image and 64 MiB combined.'
    );
  const geometries: Geometry[] = [];
  for (let i = 0; i < files.length; i++) {
    signal?.throwIfAborted();
    const header = new Uint8Array(
      await files[i].slice(0, MIXED_GIF_LIMITS.header).arrayBuffer()
    );
    signal?.throwIfAborted();
    geometries.push(imageGeometry(header, codecs[i]!));
  }
  checkMixedGeometry(geometries);
  const names: string[] = [];
  let normalizedBytes = 0;
  let first: Geometry | undefined;
  const decoded: Geometry[] = [];
  for (let i = 0; i < files.length; i++) {
    signal?.throwIfAborted();
    const source = tempFile(`.${codecs[i] === 'png' ? 'png' : 'jpg'}`);
    const target = tempFile('.png');
    const bytes = await fetchFile(files[i]);
    signal?.throwIfAborted();
    await ffmpeg.writeFile(source, bytes);
    signal?.throwIfAborted();
    const code = await ffmpeg.exec([
      '-err_detect',
      'explode',
      '-max_pixels',
      String(MIXED_GIF_LIMITS.framePixels),
      '-i',
      source,
      '-frames:v',
      '1',
      '-pix_fmt',
      'rgba',
      target
    ]);
    signal?.throwIfAborted();
    if (code !== 0)
      throw new GifInputError(
        'A mixed image could not be decoded. Replace it with a valid static PNG/JPEG.'
      );
    const data = await ffmpeg.readFile(target);
    signal?.throwIfAborted();
    if (
      typeof data === 'string' ||
      data.byteLength > MIXED_GIF_LIMITS.normalizedFile
    )
      throw new GifInputError(
        'Normalized image exceeds 20 MiB. Use smaller images.'
      );
    normalizedBytes += data.byteLength;
    if (normalizedBytes > MIXED_GIF_LIMITS.normalizedTotal)
      throw new GifInputError(
        'Normalized images exceed 64 MiB combined. Use fewer or smaller images.'
      );
    const geometry = imageGeometry(data, 'png');
    decoded.push(geometry);
    checkMixedGeometry(decoded);
    if (data[25] !== 6)
      throw new GifInputError(
        'Image normalization did not produce RGBA PNG. Replace the image.'
      );
    if (
      first &&
      (first.width !== geometry.width || first.height !== geometry.height)
    )
      throw new GifInputError(
        'Mixed PNG/JPEG images must have equal decoded pixel dimensions. Resize them to the same width and height.'
      );
    first ??= geometry;
    names.push(target);
    await ffmpeg.deleteFile(source).catch(() => {});
    signal?.throwIfAborted();
  }
  return names;
}
