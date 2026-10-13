import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from './model';
import { DEFAULT_PDF_OPTIONS } from './pdf-model';
import { planPagination } from './pagination';
const image = { ...DEFAULT_OPTIONS, width: 800 };
const pdf = DEFAULT_PDF_OPTIONS;
const capacity = planPagination(
  { height: 1, extent: 1, blocks: [] },
  image,
  pdf
).capacity;
const plan = (
  height: number,
  blocks: { top: number; bottom: number; kind: 'row' | 'block' }[] = []
) => planPagination({ height, extent: height, blocks }, image, pdf);
describe('bounded pagination contract', () => {
  it('keeps exact contiguous boundaries, partial last page and no extra blank page', () => {
    expect(plan(capacity).pages).toEqual([
      { start: 0, end: capacity, reason: 'end' }
    ]);
    for (const h of [
      capacity - 0.1,
      capacity + 0.1,
      capacity * 2,
      capacity * 2 + 100
    ]) {
      const pages = plan(h).pages;
      expect(pages[0].start).toBe(0);
      expect(pages[pages.length - 1].end).toBe(Math.ceil(h));
      expect(pages.reduce((n, p) => n + p.end - p.start, 0)).toBe(Math.ceil(h));
      pages.slice(1).forEach((p, i) => expect(p.start).toBe(pages[i].end));
    }
  });
  it('moves crossing rows/blocks whole, including fractional edges', () => {
    for (const kind of ['row', 'block'] as const) {
      const pages = plan(capacity + 150, [
        { top: capacity - 100.2, bottom: capacity + 100.4, kind }
      ]).pages;
      expect(pages[0].end).toBe(capacity - 101);
      expect(pages[1].start).toBe(pages[0].end);
      expect(pages[1].end).toBe(capacity + 150);
    }
  });
  it('rejects oversized/overlapping atomic content without non-progress loops', () => {
    expect(() =>
      plan(capacity + 1, [{ top: 0, bottom: capacity + 1, kind: 'row' }])
    ).toThrow(/taller/);
    expect(() =>
      plan(capacity + 100, [
        { top: 0, bottom: capacity - 20, kind: 'block' },
        { top: capacity - 30, bottom: capacity + 100, kind: 'row' }
      ])
    ).toThrow(/Overlapping/);
  });
  it.each([0, -1, NaN, Infinity, 10001])(
    'rejects empty/invalid/excessive geometry %s',
    (h) => {
      expect(() => plan(h)).toThrow();
    }
  );
  it.each([NaN, Infinity, -1])('validates protected coordinates %s', (top) => {
    expect(() => plan(100, [{ top, bottom: 100, kind: 'block' }])).toThrow();
  });
  it('bounds pages, cumulative pixels and per-page pixels before capture', () => {
    expect(() =>
      planPagination({ height: 10000, extent: 10000, blocks: [] }, image, {
        ...pdf,
        orientation: 'landscape',
        margins: { top: 100, bottom: 100, left: 10, right: 10 }
      })
    ).toThrow(/8 PDF pages/);
    expect(() =>
      planPagination(
        { height: 6000, extent: 6000, blocks: [] },
        { ...image, scale: 2 },
        pdf
      )
    ).toThrow(/16 MP/);
    expect(() =>
      planPagination(
        { height: 2000, extent: 2000, blocks: [] },
        { ...image, width: 1280, scale: 2 },
        pdf
      )
    ).toThrow(/4 MP/);
    expect(() =>
      planPagination({ height: 100, extent: 10001, blocks: [] }, image, pdf)
    ).toThrow(/10000/);
  });
  for (const paper of ['a4', 'letter'] as const)
    for (const orientation of ['portrait', 'landscape'] as const)
      it(`${paper}/${orientation}: asymmetric margins and scale preserve physical geometry`, () => {
        const options = {
          ...pdf,
          paper,
          orientation,
          margins: { top: 12, bottom: 30, left: 5, right: 20 }
        };
        const layout = { height: 1500, extent: 1500, blocks: [] };
        const one = planPagination(layout, image, options),
          two = planPagination(layout, { ...image, scale: 2 }, options);
        expect(one.pages).toEqual(two.pages);
        expect(one.mmPerCssPixel).toBe(two.mmPerCssPixel);
        expect(one.x).toBe(5);
        expect(one.y).toBe(12);
        expect(one.capacity * one.mmPerCssPixel).toBeLessThanOrEqual(
          one.pageHeight - 42
        );
      });
});
