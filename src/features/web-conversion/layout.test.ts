import { afterEach, describe, expect, it, vi } from 'vitest';
import { enforceCropPolicy, inspectLayout } from './layout';
const size = { width: 400, height: 200 };
function fixture(
  tag: string,
  top: number,
  bottom: number,
  right = 400,
  left = 0
) {
  const body = document.createElement('body');
  const child = document.createElement(tag);
  body.append(child);
  vi.spyOn(body, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    left: 0
  } as DOMRect);
  vi.spyOn(child, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
    left,
    right,
    width: right - left,
    height: bottom - top
  } as DOMRect);
  return body;
}
afterEach(() => {
  vi.restoreAllMocks();
});
describe('single-image boundaries', () => {
  it('accepts an exact boundary and subpixel rounding without warnings', () => {
    expect(inspectLayout(fixture('tr', 100, 200), size).notices).toEqual([]);
    expect(inspectLayout(fixture('tr', 100, 200.4), size).clipped).toBe(false);
  });
  it('reports a crossing row and blocks strict export', () => {
    const report = inspectLayout(fixture('tr', 150, 250), size);
    expect(report).toMatchObject({
      vertical: true,
      horizontal: false,
      crossingRows: 1
    });
    expect(report.notices.join(' ')).toMatch(/does not paginate rows/);
    expect(() => enforceCropPolicy(report, 'reject')).toThrow(/Export stopped/);
    expect(() => enforceCropPolicy(report, 'crop')).not.toThrow();
  });
  it('reports wholly omitted rows without claiming they cross a boundary', () => {
    expect(inspectLayout(fixture('tr', 220, 250), size)).toMatchObject({
      vertical: true,
      crossingRows: 0
    });
  });
  it('checks overflowing descendants even if wrapper scroll dimensions are small', () => {
    const body = fixture('div', 0, 100, 450, -10);
    expect(inspectLayout(body, size)).toMatchObject({
      horizontal: true,
      vertical: false
    });
  });
  it('ignores hidden zero-size rows and permits fitting strict output', () => {
    const report = inspectLayout(fixture('tr', 250, 250), size);
    expect(report.clipped).toBe(false);
    expect(() => enforceCropPolicy(report, 'reject')).not.toThrow();
  });
  it('detects body scroll overflow and both-axis notices', () => {
    const body = fixture('div', 0, 100);
    Object.defineProperties(body, {
      scrollWidth: { value: 450 },
      scrollHeight: { value: 300 }
    });
    expect(inspectLayout(body, size).notices[0]).toContain('width and height');
  });
});
