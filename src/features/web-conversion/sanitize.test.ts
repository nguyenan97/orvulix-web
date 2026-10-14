import { describe, expect, it } from 'vitest';
import { frameDocument, prepareHtml } from './sanitize';
import { RASTER_FIXTURES } from './assets.fixtures';
describe('static HTML policy', () => {
  it('preserves safe system font stacks but warns for unavailable custom fonts and page breaks', () => {
    const safe = prepareHtml(
      '<p style="font-family: Arial, sans-serif">Nguyễn An</p><pre style="font-family: system-ui, monospace">code</pre>'
    );
    expect(safe.markup).toContain('Arial, sans-serif');
    expect(safe.markup).toContain('system-ui, monospace');
    expect(safe.notices).toEqual([]);
    const unsupported = prepareHtml(
      '<p style="font-family: CustomFont, serif;break-inside:avoid">Text</p>'
    );
    expect(unsupported.markup).not.toMatch(/CustomFont|break-inside/);
    expect(unsupported.notices.join(' ')).toMatch(/Unsupported inline styles/);
  });
  it('preserves bounded border longhands emitted by browser CSSOM', () => {
    const result = prepareHtml(
      '<p style="border-top-width:0px;border-top-style:solid;border-top-color:white;border-right-width:99px">Cell</p>'
    );
    expect(result.markup).toContain('border-top-width: 0px');
    expect(result.markup).toContain('border-top-color: white');
    expect(result.markup).not.toContain('99px');
  });
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
    expect(() =>
      prepareHtml('<img src="https://blocked.test/logo.png">')
    ).toThrow(/No supported/));
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
    expect(result).toContain('img-src data:');
    expect(result).toContain("script-src 'none'");
  });
});

it('keeps raster headers and alt/dimensions but removes srcset and handlers', () => {
  const result = prepareHtml(
    `<img src="${RASTER_FIXTURES.png}" alt="Logo" width="32" height="32" srcset="https://blocked.test/hi.png 2x" onerror="alert(1)">`
  );
  expect(result.assets).toHaveLength(1);
  expect(result.markup).toContain('alt="Logo"');
  expect(result.markup).toContain('width="32"');
  expect(result.markup).not.toMatch(/srcset|onerror|blocked\.test/);
});
