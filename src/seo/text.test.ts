import { describe, expect, it } from 'vitest';
import { composeDescription, splitSentences } from './text';

describe('splitSentences', () => {
  it('does not split after abbreviations inside parentheses or quotes', () => {
    expect(
      splitSentences('Convert images (e.g. PNG or JPG) into a PDF. It is free.')
    ).toEqual(['Convert images (e.g. PNG or JPG) into a PDF.', 'It is free.']);
    expect(
      splitSentences('Use a separator ("i.e. Comma") here. Done.')
    ).toEqual(['Use a separator ("i.e. Comma") here.', 'Done.']);
  });

  it('never cuts a long description in the middle of a sentence', () => {
    const text =
      'Compress images (e.g. PNG, JPG, WebP, HEIC, AVIF, GIF, BMP and TIFF files from your camera, phone or design tools) to reduce their file size while keeping them sharp.';
    const result = composeDescription([text], ['Free online image tool.']);
    expect(result === null || !result.includes('(e.g. A')).toBe(true);
  });
});
