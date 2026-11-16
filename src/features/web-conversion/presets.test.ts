import { describe, expect, it } from 'vitest';
import { CONVERSION_PRESETS, resolvePreset } from './presets';
import { planPagination } from './pagination';
import { validateOptions } from './model';
describe('built-in option-only presets', () => {
  it('has unique IDs and every template satisfies the same manual option contracts', () => {
    expect(new Set(CONVERSION_PRESETS.map((p) => p.id)).size).toBe(
      CONVERSION_PRESETS.length
    );
    for (const p of CONVERSION_PRESETS) {
      const result = resolvePreset(p.id, p.output, 'Nguyễn/An');
      expect(result.image.filename).toBe('Nguyễn/An');
      expect(Object.keys(result.image).sort()).toEqual(
        [
          'width',
          'height',
          'scale',
          'format',
          'background',
          'quality',
          'filename',
          'cropPolicy'
        ].sort()
      );
      if (result.output === 'pdf' && result.layout === 'paginated') {
        const plan = planPagination(
          { height: 100, extent: 100, blocks: [] },
          result.image,
          result.pdf
        );
        expect(plan.pages).toHaveLength(1);
      } else validateOptions(result.image);
      expect(result).not.toHaveProperty('html');
      expect(result).not.toHaveProperty('assets');
      expect(result).not.toHaveProperty('file');
    }
  });
  it('returns independent images and deeply independent PDF margins on every application', () => {
    const first = resolvePreset('a4-pages', 'pdf', 'a'),
      second = resolvePreset('a4-pages', 'pdf', 'b');
    if (first.output !== 'pdf' || second.output !== 'pdf')
      throw Error('PDF contract expected');
    first.image.width = NaN;
    first.pdf.margins.left = -1;
    expect(second.image.width).toBe(800);
    expect(second.pdf.margins.left).toBe(10);
    expect(resolvePreset('a4-pages', 'pdf', 'c')).toEqual({
      ...second,
      image: { ...second.image, filename: 'c' }
    });
  });
  it.each(['', 'unknown', '__proto__', 'constructor', 'A4-PAGES'])(
    'rejects unknown ID %s instead of falling back',
    (id) => expect(() => resolvePreset(id, 'pdf', 'f')).toThrow(/supported/)
  );
  it('rejects cross-output selections and keeps Unicode filename until the existing export sanitizer', () => {
    expect(() => resolvePreset('square-png', 'pdf', 'f')).toThrow();
    expect(() => resolvePreset('a4-one', 'image', 'f')).toThrow();
    expect(resolvePreset('wide-jpeg', 'image', 'Hóa đơn')).toMatchObject({
      image: {
        filename: 'Hóa đơn',
        format: 'jpeg',
        background: 'white',
        width: 960,
        height: 540
      }
    });
  });
});
