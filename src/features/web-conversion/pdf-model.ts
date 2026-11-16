import { validateOptions, type ImageOptions } from './model';

export const PDF_LIMITS = {
  outputBytes: 8 * 1024 * 1024,
  timeoutMs: 10_000
} as const;
export interface PdfOptions {
  paper: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
}
export const DEFAULT_PDF_OPTIONS: PdfOptions = {
  paper: 'a4',
  orientation: 'portrait',
  margins: { top: 10, right: 10, bottom: 10, left: 10 }
};
export function pdfGeometry(options: PdfOptions, image: ImageOptions) {
  validateOptions(image);
  if (image.format !== 'png') throw Error('PDF capture must use PNG.');
  if (
    !['a4', 'letter'].includes(options.paper) ||
    !['portrait', 'landscape'].includes(options.orientation) ||
    !options.margins
  )
    throw Error('Unsupported PDF options.');
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const value = options.margins[side];
    if (!Number.isFinite(value) || value < 0 || value > 100)
      throw Error('Each margin must be a finite number from 0 to 100 mm.');
  }
  let [pageWidth, pageHeight] =
    options.paper === 'a4' ? [210, 297] : [215.9, 279.4];
  if (options.orientation === 'landscape')
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  const printableWidth =
    pageWidth - options.margins.left - options.margins.right;
  const printableHeight =
    pageHeight - options.margins.top - options.margins.bottom;
  if (printableWidth <= 0 || printableHeight <= 0)
    throw Error('Margins must leave a positive printable area.');
  const mmPerCssPixel = Math.min(
    printableWidth / image.width,
    printableHeight / image.height
  );
  const width = image.width * mmPerCssPixel,
    height = image.height * mmPerCssPixel;
  return {
    pageWidth,
    pageHeight,
    printableWidth,
    printableHeight,
    width,
    height,
    mmPerCssPixel,
    x: options.margins.left + (printableWidth - width) / 2,
    y: options.margins.top + (printableHeight - height) / 2
  };
}
