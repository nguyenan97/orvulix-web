export const LIMITS = {
  inputBytes: 64 * 1024,
  nodes: 1000,
  depth: 24,
  pixels: 2_000_000,
  outputBytes: 8 * 1024 * 1024,
  timeoutMs: 10_000
} as const;

export interface ImageOptions {
  width: number;
  height: number;
  scale: number;
  format: 'png' | 'jpeg';
  background: 'white' | 'transparent';
  quality: number;
  filename: string;
  cropPolicy: 'crop' | 'reject';
}
export const DEFAULT_OPTIONS: ImageOptions = {
  width: 800,
  height: 600,
  scale: 1,
  format: 'png',
  background: 'white',
  quality: 0.9,
  filename: 'html-image',
  cropPolicy: 'crop'
};
export function validateInput(input: string) {
  if (!input.trim()) throw Error('Enter HTML or upload an HTML file.');
  if (
    input.length > LIMITS.inputBytes ||
    new TextEncoder().encode(input).length > LIMITS.inputBytes
  )
    throw Error('HTML must be at most 64 KiB.');
}
export function validateOptions(options: ImageOptions) {
  for (const [value, min, max, label] of [
    [options.width, 320, 1280, 'Width'],
    [options.height, 100, 1080, 'Height']
  ] as const) {
    if (!Number.isInteger(value) || value < min || value > max)
      throw Error(`${label} must be an integer from ${min} to ${max}.`);
  }
  if (![1, 2].includes(options.scale)) throw Error('Scale must be 1 or 2.');
  if (options.width * options.height * options.scale ** 2 > LIMITS.pixels)
    throw Error('Output exceeds 2 megapixels. Reduce dimensions or scale.');
  if (
    !['png', 'jpeg'].includes(options.format) ||
    !['white', 'transparent'].includes(options.background) ||
    !['crop', 'reject'].includes(options.cropPolicy)
  )
    throw Error('Unsupported image options.');
  if (
    !Number.isFinite(options.quality) ||
    options.quality < 0.1 ||
    options.quality > 1
  )
    throw Error('JPEG quality must be from 0.1 to 1.');
}
export function safeFilename(
  name: string,
  format: ImageOptions['format'] | 'pdf'
) {
  const input =
    format === 'pdf'
      ? name.replace(
          /[\u0080-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g,
          '-'
        )
      : name;
  const cleaned = Array.from(input, (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 || '<>:"/\\|?*'.includes(character)
      ? '-'
      : character;
  })
    .join('')
    .replace(format === 'pdf' ? /\.(pdf|png|jpe?g)$/i : /\.(png|jpe?g)$/i, '')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 80);
  const stem = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(cleaned)
    ? `${format === 'pdf' ? 'pdf' : 'image'}-${cleaned}`
    : cleaned;
  return `${stem || (format === 'pdf' ? 'html-pdf' : 'html-image')}.${
    format === 'jpeg' ? 'jpg' : format
  }`;
}
export function abortError() {
  return new DOMException('Conversion cancelled.', 'AbortError');
}
export function checkAbort(signal: AbortSignal) {
  if (signal.aborted) throw abortError();
}
