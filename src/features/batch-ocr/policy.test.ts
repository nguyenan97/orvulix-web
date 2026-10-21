import { describe, expect, it } from 'vitest';
import {
  dimensions,
  imageBytes,
  entryName,
  language,
  validateSelection
} from './policy';
describe('batch OCR admission', () => {
  it('requires an explicit supported language', () => {
    expect(() => language('')).toThrow('Choose');
    expect(language('eng+vie')).toBe('eng+vie');
  });
  it('rejects batch sizes before reading image data', () => {
    expect(() => validateSelection([])).toThrow('1 and 10');
    expect(() =>
      validateSelection(Array(11).fill(new File(['x'], 'a.png')))
    ).toThrow();
    expect(() =>
      validateSelection([
        new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'a.png')
      ])
    ).toThrow('4 MiB');
  });
  it('rejects animated PNG instead of silently recognizing one frame', () => {
    const bytes = new Uint8Array(53);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const v = new DataView(bytes.buffer);
    v.setUint32(8, 13);
    v.setUint32(12, 0x49484452);
    v.setUint32(16, 10);
    v.setUint32(20, 10);
    v.setUint32(33, 8);
    v.setUint32(37, 0x6163544c);
    expect(() => dimensions(bytes)).toThrow('Animated');
  });
  it('makes bounded unique flat archive names from hostile/duplicate filenames', () => {
    expect(entryName('../../a.png', 0)).toBe('001-______a.txt');
    expect(entryName('a.png', 1)).toBe('002-a.txt');
  });
});
it('enforces aggregate bytes and pixel limits, accepts valid baseline JPEG headers', () => {
  const bytes = new Uint8Array(23);
  bytes.set([255, 216, 255, 192, 0, 17, 8, 0, 10, 0, 20]);
  expect(dimensions(bytes)).toEqual([20, 10]);
  const v = new DataView(bytes.buffer);
  v.setUint16(7, 3000);
  v.setUint16(9, 3000);
  expect(() => dimensions(bytes)).toThrow('4 million');
  expect(() =>
    dimensions(new Uint8Array([255, 216, 255, 192, 255, 255]))
  ).toThrow('Truncated');
  expect(() =>
    validateSelection(
      Array(7).fill(new File([new Uint8Array(4 * 1024 * 1024)], 'a'))
    )
  ).toThrow('24 MiB');
});

it('removes compressed metadata from the codec working copy and rejects duplicate image headers', () => {
  const b = new Uint8Array(81);
  b.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const v = new DataView(b.buffer);
  v.setUint32(8, 13);
  v.setUint32(12, 0x49484452);
  v.setUint32(16, 10);
  v.setUint32(20, 10);
  v.setUint32(33, 12);
  v.setUint32(37, 0x69434350); // opaque iCCP bytes are never inflated
  v.setUint32(61, 0x49444154);
  v.setUint32(73, 0x49454e44);
  const result = imageBytes(b);
  expect(result.length).toBe(57);
  expect(new DataView(result.buffer).getUint32(37)).toBe(0x49444154);
  expect(b.length).toBe(81);
  v.setUint32(37, 0x49484452);
  expect(() => imageBytes(b)).toThrow('Duplicate');
});
