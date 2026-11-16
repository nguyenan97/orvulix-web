import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, safeFilename } from './model';
import { DEFAULT_PDF_OPTIONS, pdfGeometry, type PdfOptions } from './pdf-model';
const image = { ...DEFAULT_OPTIONS, width: 400, height: 200 };
describe('one-page PDF geometry', () => {
  it.each([
    ['a4', 'portrait', 210, 297],
    ['a4', 'landscape', 297, 210],
    ['letter', 'portrait', 215.9, 279.4],
    ['letter', 'landscape', 279.4, 215.9]
  ] as const)(
    'fits %s %s without stretching',
    (paper, orientation, pageWidth, pageHeight) => {
      const geometry = pdfGeometry(
        { ...DEFAULT_PDF_OPTIONS, paper, orientation },
        image
      );
      expect([geometry.pageWidth, geometry.pageHeight]).toEqual([
        pageWidth,
        pageHeight
      ]);
      expect(geometry.width / geometry.height).toBe(2);
      expect(geometry.x).toBeCloseTo((pageWidth - geometry.width) / 2, 8);
      expect(geometry.y).toBeCloseTo((pageHeight - geometry.height) / 2, 8);
      expect(geometry.width).toBeLessThanOrEqual(geometry.printableWidth);
      expect(geometry.height).toBeLessThanOrEqual(geometry.printableHeight);
      expect(
        pdfGeometry(
          { ...DEFAULT_PDF_OPTIONS, paper, orientation },
          { ...image, scale: 2 }
        )
      ).toEqual(geometry);
    }
  );
  it('accepts exact margin bounds and decimal asymmetric placement', () => {
    for (const margins of [
      { top: 0, right: 0, bottom: 0, left: 0 },
      { top: 100, right: 100, bottom: 100, left: 100 },
      { top: 12.5, right: 20, bottom: 30, left: 5 }
    ]) {
      const result = pdfGeometry({ ...DEFAULT_PDF_OPTIONS, margins }, image);
      expect(result.x).toBeCloseTo(
        margins.left + (result.printableWidth - result.width) / 2,
        8
      );
      expect(result.y).toBeCloseTo(
        margins.top + (result.printableHeight - result.height) / 2,
        8
      );
    }
  });
  it.each(['top', 'right', 'bottom', 'left'] as const)(
    'rejects invalid %s margins',
    (side) => {
      for (const value of [-0.01, 100.01, NaN, Infinity])
        expect(() =>
          pdfGeometry(
            {
              ...DEFAULT_PDF_OPTIONS,
              margins: { ...DEFAULT_PDF_OPTIONS.margins, [side]: value }
            },
            image
          )
        ).toThrow(/margin/);
    }
  );
  it('rejects untrusted enums, collapsed/negative printable areas and invalid raster bounds', () => {
    for (const options of [
      { ...DEFAULT_PDF_OPTIONS, paper: 'legal' },
      { ...DEFAULT_PDF_OPTIONS, orientation: 'sideways' },
      {
        ...DEFAULT_PDF_OPTIONS,
        margins: { top: 0, bottom: 0, left: 105, right: 105 }
      },
      {
        ...DEFAULT_PDF_OPTIONS,
        margins: { top: 0, bottom: 0, left: 150, right: 150 }
      }
    ])
      expect(() => pdfGeometry(options as PdfOptions, image)).toThrow();
    for (const change of [
      { width: 0 },
      { height: Infinity },
      { width: 1280, height: 1080, scale: 2 },
      { format: 'jpeg' }
    ])
      expect(() =>
        pdfGeometry(DEFAULT_PDF_OPTIONS, {
          ...image,
          ...change
        } as typeof image)
      ).toThrow();
  });
  it.each([
    ['Nguyễn An.pdf', 'Nguyễn An.pdf'],
    ['', 'html-pdf.pdf'],
    ['CON', 'pdf-CON.pdf'],
    ['report.PNG', 'report.pdf'],
    ['\u0000/unsafe\\name.pdf', '--unsafe-name.pdf'],
    ['report\u202e.pdf', 'report-.pdf'],
    ['line\u0085\u2028.pdf', 'line--.pdf']
  ])('sanitizes PDF filename %s', (input, expected) =>
    expect(safeFilename(input, 'pdf')).toBe(expected)
  );
});
