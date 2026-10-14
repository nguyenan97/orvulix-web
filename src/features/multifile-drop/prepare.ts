import { FileKind, LIMITS } from './policy';
const WAIT_MS = 15_000;
function bounded<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(Error('File import timed out. Try a smaller supported file.'));
    }, WAIT_MS);
    signal.addEventListener('abort', abort, { once: true });
    work.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error);
      }
    );
  });
}
export function inspectImage(file: File, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
    const fail = (error: unknown) => {
      cleanup();
      reject(error);
    };
    const abort = () => fail(signal.reason);
    const timer = setTimeout(
      () => fail(Error('Image metadata timed out.')),
      WAIT_MS
    );
    signal.addEventListener('abort', abort, { once: true });
    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      if (
        !width ||
        !height ||
        width > 8192 ||
        height > 8192 ||
        width * height > 16_000_000
      ) {
        fail(Error('Image must be at most 8192px per side and 16 megapixels.'));
        return;
      }
      cleanup();
      resolve();
    };
    image.onerror = () =>
      fail(Error('Image cannot be decoded. Choose a supported image.'));
    image.src = url;
  });
}
export async function prepareFile(
  file: File,
  kind: FileKind,
  signal: AbortSignal
): Promise<File> {
  signal.throwIfAborted();
  let result = file;
  if (kind === 'image') {
    // Upstream #458 intent; lazy HEIC conversion retains the existing format path.
    const header = new Uint8Array(
      await bounded(file.slice(0, 32).arrayBuffer(), signal)
    );
    const brand = String.fromCharCode(...header.subarray(4, 12));
    if (
      /\.hei[cf]$/i.test(file.name) ||
      /^image\/hei[cf]$/i.test(file.type) ||
      /^ftyp(heic|heix|hevc|hevx|mif1|msf1)/.test(brand)
    ) {
      const { heicTo, isHeic } = await bounded(import('heic-to'), signal);
      if (!(await bounded(isHeic(file), signal)))
        throw Error('Invalid HEIC/HEIF image.');
      const blob = await bounded(
        heicTo({ blob: file, type: 'image/jpeg' }),
        signal
      );
      if (blob.size > LIMITS.image.file)
        throw Error('Converted image exceeds 16 MiB.');
      result = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
        type: 'image/jpeg',
        lastModified: file.lastModified
      });
    }
    await inspectImage(result, signal);
  } else if (kind === 'pdf') {
    const { PDFDocument } = await bounded(import('pdf-lib'), signal);
    const bytes = await bounded(file.arrayBuffer(), signal);
    const doc = await bounded(
      PDFDocument.load(bytes, { updateMetadata: false }),
      signal
    );
    if (!doc.getPageCount()) throw Error('PDF must contain a page.');
  }
  // Audio/video decoding belongs to existing FFmpeg consumers, not native playback.
  signal.throwIfAborted();
  return result;
}
