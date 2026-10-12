import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPTIONS,
  LIMITS,
  safeFilename,
  validateInput,
  validateOptions
} from './model';
describe('HTML image bounds', () => {
  it.each(['', '   ', '\n\t'])('rejects blank input %j', (input) =>
    expect(() => validateInput(input)).toThrow(/Enter HTML/)
  );
  it('counts UTF-8 bytes and accepts the exact byte boundary', () => {
    expect(() => validateInput('a'.repeat(LIMITS.inputBytes))).not.toThrow();
    expect(() => validateInput('é'.repeat(LIMITS.inputBytes / 2 + 1))).toThrow(
      /64 KiB/
    );
    expect(() => validateInput('a'.repeat(LIMITS.inputBytes + 1))).toThrow(
      /64 KiB/
    );
  });
  it.each([
    { width: 319 },
    { width: 1281 },
    { width: NaN },
    { width: 500.5 },
    { height: 99 },
    { height: 1081 },
    { height: Infinity },
    { scale: 3 },
    { width: 1280, height: 1080, scale: 2 },
    { quality: 0 },
    { quality: NaN }
  ])('rejects invalid options %j', (overrides) =>
    expect(() =>
      validateOptions({ ...DEFAULT_OPTIONS, ...overrides })
    ).toThrow()
  );
  it('accepts defaults and an output just below the pixel cap', () => {
    expect(() => validateOptions(DEFAULT_OPTIONS)).not.toThrow();
    expect(() =>
      validateOptions({ ...DEFAULT_OPTIONS, scale: 2 })
    ).not.toThrow();
  });
  it.each([
    ['../../bad.png', 'png', 'bad.png'],
    ['CON', 'jpeg', 'image-CON.jpg'],
    ['', 'png', 'html-image.png'],
    ['report.JPG', 'jpeg', 'report.jpg'],
    ['Nguyễn An', 'png', 'Nguyễn An.png']
  ] as const)('sanitizes filename %s', (name, format, expected) => {
    const result = safeFilename(name, format);
    if (name === '../../bad.png') expect(result).not.toMatch(/[\/\\]/);
    else expect(result).toBe(expected);
  });
});
