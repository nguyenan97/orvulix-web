import type { ImageOptions } from './model';

export interface LayoutReport {
  clipped: boolean;
  horizontal: boolean;
  vertical: boolean;
  crossingRows: number;
  notices: string[];
}
// Ignore subpixel rounding below half a CSS pixel, not whole hidden rows.
const EPSILON = 0.5;
export function inspectLayout(
  body: HTMLElement,
  options: Pick<ImageOptions, 'width' | 'height'>
): LayoutReport {
  const origin = body.getBoundingClientRect();
  let horizontal = body.scrollWidth > options.width + EPSILON;
  let vertical = body.scrollHeight > options.height + EPSILON;
  let crossingRows = 0;
  // The sanitizer already caps this tree at 1000 nodes. Inspect descendants
  // too: fixed-height wrappers can conceal overflow in body.scrollHeight.
  for (const element of Array.from(body.querySelectorAll('*'))) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const top = rect.top - origin.top;
    const bottom = rect.bottom - origin.top;
    const left = rect.left - origin.left;
    const right = rect.right - origin.left;
    horizontal ||= left < -EPSILON || right > options.width + EPSILON;
    vertical ||= top < -EPSILON || bottom > options.height + EPSILON;
    if (
      element.localName === 'tr' &&
      top < options.height - EPSILON &&
      bottom > options.height + EPSILON
    )
      crossingRows++;
  }
  const notices: string[] = [];
  if (horizontal || vertical)
    notices.push(
      `Content exceeds the image ${
        horizontal && vertical
          ? 'width and height'
          : horizontal
            ? 'width'
            : 'height'
      }. Cropped output omits content; increase dimensions or shorten the HTML.`
    );
  if (crossingRows)
    notices.push(
      `${crossingRows} table row(s) cross the bottom boundary and will be cut. This tool exports one image and does not paginate rows.`
    );
  return {
    clipped: horizontal || vertical,
    horizontal,
    vertical,
    crossingRows,
    notices
  };
}
export function enforceCropPolicy(
  report: LayoutReport,
  policy: ImageOptions['cropPolicy']
) {
  if (policy === 'reject' && report.clipped)
    throw Error(
      'Export stopped because content would be cropped. Increase dimensions, shorten the HTML or choose Allow cropping.'
    );
}
