import { describe, expect, it } from 'vitest';
import { frameDocument, prepareHtml } from './sanitize';
describe('static HTML policy', () => {
  it('preserves Vietnamese text, tables and safe inline styles', () => {
    const result = prepareHtml(
      '<h1 style="color:#0f766e;font-size:24px">Nguyễn An</h1><table><tr><td colspan="2">Invoice</td></tr></table>'
    );
    expect(result.markup).toContain('Nguyễn An');
    expect(result.markup).toContain('font-size: 24px');
    expect(result.markup).toContain('colspan="2"');
  });
  it.each([
    '<script>parent.alert(1)</script>',
    '<img src="https://blocked.test/x">',
    '<iframe src="https://blocked.test/x"></iframe>',
    '<style>@import "https://blocked.test/css";</style>',
    '<meta http-equiv="refresh" content="0;url=https://blocked.test/x">',
    '<base href="https://blocked.test/">',
    '<svg><image href="https://blocked.test/x" /></svg>'
  ])('removes active/resource markup %s', (payload) => {
    const result = prepareHtml(`${payload}<p>Safe content</p>`);
    expect(result.markup).toBe('<p>Safe content</p>');
    expect(result.notices.length).toBeGreaterThan(0);
  });
  it('removes handlers, URL CSS, position, giant dimensions and navigation attributes', () => {
    const result = prepareHtml(
      '<div onclick="alert(1)" id="example" style="background-image:url(https://blocked.test/x);position:fixed;width:99999px;padding:8px;color:red">Safe</div>'
    );
    expect(result.markup).not.toMatch(/onclick|example|url\(|position|99999/);
    expect(result.markup).toContain('padding: 8px');
    expect(result.notices.length).toBeGreaterThan(0);
  });
  it('rejects unsupported-only content', () =>
    expect(() => prepareHtml('<img src="data:image/png;base64,a">')).toThrow(
      /No supported/
    ));
  it('rejects deep and numerous nodes', () => {
    expect(() =>
      prepareHtml('<div>'.repeat(25) + 'hello' + '</div>'.repeat(25))
    ).toThrow(/level limit/);
    expect(() => prepareHtml('<p>a</p>'.repeat(501))).toThrow(/node/);
  });
  it('normalizes invalid spans and handles malformed snippets', () => {
    expect(prepareHtml('<table><tr><td colspan="9999">a').markup).not.toContain(
      '9999'
    );
    expect(prepareHtml('<p>hello <b>world').markup).toContain('world');
  });
  it('places the network-denying policy before user content', () => {
    const result = frameDocument(prepareHtml('<p>Hello</p>'));
    expect(result.indexOf('Content-Security-Policy')).toBeLessThan(
      result.indexOf('<body>')
    );
    expect(result).toContain("img-src 'none'");
    expect(result).toContain("script-src 'none'");
  });
});
