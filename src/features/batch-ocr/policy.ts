export const MAX_TEXT = 100_000;
export const MAX_TOTAL_TEXT = 500_000;
export type Language = 'eng' | 'vie' | 'eng+vie';
export function language(value: string): Language {
  if (!['eng', 'vie', 'eng+vie'].includes(value))
    throw Error('Choose an OCR language before running.');
  return value as Language;
}
export function validateSelection(files: readonly File[]) {
  if (!files.length || files.length > 10)
    throw Error('Choose between 1 and 10 PNG/JPEG files.');
  if (files.some((f) => !f.size || f.size > 4 * 1024 * 1024))
    throw Error('Each file must be non-empty and at most 4 MiB.');
  if (files.reduce((sum, f) => sum + f.size, 0) > 24 * 1024 * 1024)
    throw Error('Maximum 24 MiB combined.');
}
export function dimensions(bytes: Uint8Array): [number, number] {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0,
    height = 0;
  if (
    bytes.length >= 33 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b) &&
    v.getUint32(8) === 13 &&
    v.getUint32(12) === 0x49484452
  ) {
    width = v.getUint32(16);
    height = v.getUint32(20);
    let offset = 33;
    while (offset + 12 <= bytes.length) {
      const size = v.getUint32(offset);
      if (size > bytes.length - offset - 12)
        throw Error('Truncated PNG chunk.');
      if (v.getUint32(offset + 4) === 0x6163544c)
        throw Error('Animated PNG is unsupported.');
      offset += size + 12;
    }
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 255) throw Error('Invalid JPEG header.');
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) throw Error('Truncated JPEG header.');
      const length = v.getUint16(offset);
      if (length < 2 || offset + length > bytes.length)
        throw Error('Truncated JPEG header.');
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      ) {
        if (![0xc0, 0xc2].includes(marker) || length < 8 || width)
          throw Error(
            'Only baseline/progressive single-frame JPEG is supported.'
          );
        height = v.getUint16(offset + 3);
        width = v.getUint16(offset + 5);
      }
      offset += length;
    }
  }
  if (!width || !height)
    throw Error('Choose a valid static PNG or JPEG image.');
  if (width > 4096 || height > 4096 || width * height > 4_000_000)
    throw Error('Maximum 4096 pixels per side and 4 million pixels per image.');
  return [width, height];
}
export function entryName(name: string, index: number) {
  const stem =
    name
      .replace(/\.[^.]*$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60) || 'image';
  return `${String(index + 1).padStart(3, '0')}-${stem}.txt`;
}
/** Strip PNG metadata before libpng can inflate compressed profiles/text. */
export function imageBytes(bytes: Uint8Array) {
  dimensions(bytes);
  if (bytes[0] !== 137) return bytes;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept = [bytes.subarray(0, 33)];
  let offset = 33,
    count = 1,
    hasData = false,
    ended = false;
  while (offset + 12 <= bytes.length) {
    if (++count > 512) throw Error('PNG exceeds the 512-chunk limit.');
    const length = view.getUint32(offset),
      type = view.getUint32(offset + 4);
    if (length > bytes.length - offset - 12)
      throw Error('Truncated PNG chunk.');
    if (type === 0x49484452) throw Error('Duplicate PNG image header.');
    if (
      !(bytes[offset + 4] & 32) &&
      ![0x504c5445, 0x49444154, 0x49454e44].includes(type)
    )
      throw Error('Unsupported critical PNG chunk.');
    // OCR needs image samples and transparency, not ICC/EXIF/text metadata.
    if ([0x504c5445, 0x74524e53, 0x49444154, 0x49454e44].includes(type))
      kept.push(bytes.subarray(offset, offset + length + 12));
    if (type === 0x49444154) hasData = true;
    offset += length + 12;
    if (type === 0x49454e44) {
      ended = length === 0 && offset === bytes.length;
      break;
    }
  }
  if (!hasData || !ended)
    throw Error('PNG is missing image data or its final end chunk.');
  const output = new Uint8Array(
    kept.reduce((sum, part) => sum + part.length, 0)
  );
  let position = 0;
  for (const part of kept) {
    output.set(part, position);
    position += part.length;
  }
  return output;
}
