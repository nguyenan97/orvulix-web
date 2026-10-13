import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureDocument, paginatedDocument } from './pagination-layout';
import { prepareHtml } from './sanitize';
function bounds(element: Element, top: number, height: number, width = 320) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom: top + height,
    left: 0,
    right: width,
    width,
    height,
    x: 0,
    y: top,
    toJSON: () => ({})
  });
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: height
  });
  Object.defineProperty(element, 'scrollWidth', {
    configurable: true,
    value: width
  });
}
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});
describe('measured source bounds', () => {
  it('includes overflowing descendants, trims unpainted trailing blank wrappers and ignores hidden geometry', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<div><p>A</p><p>B</p><div></div></div><p style="display:none">Hidden</p>';
    document.body.append(root);
    bounds(root, 0, 1000);
    const [wrapper, a, b, empty, hidden] = root.querySelectorAll('*');
    bounds(wrapper, 0, 1000);
    bounds(a, 0, 100);
    bounds(b, 100, 100);
    bounds(empty, 200, 800);
    bounds(hidden, 0, 0, 0);
    const result = measureDocument(root, 320);
    expect(result.height).toBe(200);
    expect(result.extent).toBe(1000);
    expect(result.blocks).toEqual([
      { top: 0, bottom: 100, kind: 'block' },
      { top: 100, bottom: 200, kind: 'block' }
    ]);
  });
  it('protects simple rows and makes rowspan/nested tables atomic', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<table><tbody><tr><td rowspan="2">A</td></tr><tr><td>B</td></tr></tbody></table>';
    document.body.append(root);
    bounds(root, 0, 200);
    for (const el of root.querySelectorAll('*')) bounds(el, 0, 200);
    const result = measureDocument(root, 320);
    expect(result.blocks).toContainEqual({
      top: 0,
      bottom: 200,
      kind: 'block'
    });
    expect(result.blocks.filter((b) => b.kind === 'row')).toHaveLength(2);
  });
  it('rejects horizontal overflow, negative/nonfinite measured offsets', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Text</p>';
    document.body.append(root);
    bounds(root, 0, 100);
    const p = root.firstElementChild!;
    bounds(p, 0, 100, 321);
    expect(() => measureDocument(root, 320)).toThrow(/width/);
    bounds(p, -1, 100);
    expect(() => measureDocument(root, 320)).toThrow(/geometry/);
    bounds(p, NaN, 100);
    expect(() => measureDocument(root, 320)).toThrow(/geometry/);
  });
  it('accounts for Firefox collapsed row/group outer-border scrollWidth without hiding real overflow', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<table style="border-collapse:collapse"><tbody><tr><td>A</td></tr></tbody></table>';
    document.body.append(root);
    bounds(root, 0, 40);
    const [table, group, row, cell] = root.querySelectorAll('*');
    bounds(table, 0, 40);
    bounds(group, 0, 40, 319);
    bounds(row, 0, 40, 319);
    bounds(cell, 0, 40, 160);
    // happy-dom omits native row-group display, so supply the observed browser metrics.
    const computed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (el) =>
        new Proxy(computed(el), {
          get(target, key) {
            if (key === 'display' && el === group) return 'table-row-group';
            if (key === 'display' && el === row) return 'table-row';
            return Reflect.get(target, key, target);
          }
        })
    );
    for (const el of [group, row])
      Object.defineProperty(el, 'scrollWidth', {
        configurable: true,
        value: 320
      });
    expect(measureDocument(root, 320).height).toBe(40);
    Object.defineProperty(row, 'scrollWidth', {
      configurable: true,
      value: 321
    });
    expect(() => measureDocument(root, 320)).toThrow(/width/);
    bounds(row, 0, 40, 319);
    Object.defineProperty(cell, 'scrollWidth', {
      configurable: true,
      value: 162
    });
    expect(() => measureDocument(root, 320)).toThrow(/width/);
  });
  it('keeps trusted clipping wrapper/CSP and rejects invalid offsets', () => {
    const prepared = prepareHtml('<p onclick="x()">Safe</p>');
    const doc = paginatedDocument(prepared, 100);
    expect(doc).toContain('translateY(-100px)');
    expect(doc).toContain("script-src 'none'");
    expect(doc).not.toContain('onclick');
    for (const offset of [-1, NaN, Infinity, 0.5, 10001])
      expect(() => paginatedDocument(prepared, offset)).toThrow();
  });
});
