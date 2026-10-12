import { describe, expect, it } from 'vitest';
import { discoverTools } from '../../scripts/seo/discover.mjs';
import { validateRouteHtml } from '../../scripts/seo/validate-html.mjs';
import { SITE } from './config';
import { buildSeoSite, resolveSeoPage } from './model';
import { TOOL_OVERRIDES } from './overrides';
import { renderDocument } from './static-html';

const TEMPLATE =
  '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Template</title>\n</head>\n<body>\n<div id="root"></div>\n</body>\n</html>\n';

const load = async () => {
  const { tools, translate } = await discoverTools();
  return buildSeoSite({
    tools,
    translate,
    language: 'en',
    overrides: TOOL_OVERRIDES
  }).site;
};

describe('validateRouteHtml', () => {
  it('accepts generated documents for every page kind and the 404 page', async () => {
    const site = await load();
    for (const path of [
      '/',
      '/about',
      '/categories/json',
      '/json/prettify',
      '/string/uppercase'
    ]) {
      const page = resolveSeoPage(site, path);
      expect(
        validateRouteHtml(renderDocument(TEMPLATE, page), page, SITE, path)
      ).toEqual([]);
    }
    expect(
      validateRouteHtml(
        renderDocument(TEMPLATE, site.notFound),
        site.notFound,
        SITE,
        '404'
      )
    ).toEqual([]);
  });

  it.each([
    [
      'a second canonical',
      (html: string) =>
        html.replace(
          '</head>',
          '<link rel="canonical" href="https://orvulix.io.vn/x" /></head>'
        ),
      /expected one canonical/
    ],
    [
      'a missing og:image',
      (html: string) => html.replace(/<meta property="og:image" [^>]*>/, ''),
      /expected one og:image tag/
    ],
    [
      'noindex on an indexable page',
      (html: string) => html.replace('index, follow', 'noindex, follow'),
      /indexable page is noindex/
    ],
    [
      'invalid JSON-LD',
      (html: string) => html.replace('"@context"', '"@context" ,,'),
      /not valid JSON/
    ],
    [
      'a SearchAction',
      (html: string) =>
        html.replace(
          '"@type":"WebApplication"',
          '"@type":"WebApplication","potentialAction":{"@type":"SearchAction"}'
        ),
      /search actions/
    ],
    [
      'a foreign URL in JSON-LD',
      (html: string) =>
        html.replace(
          '"isAccessibleForFree":true',
          '"isAccessibleForFree":true,"sameAs":"https://example.com/"'
        ),
      /unexpected URL/
    ],
    [
      'an H1 in the static root content',
      (html: string) =>
        html.replace(
          '<div id="root"><div data-seo-static>',
          '<div id="root"><div data-seo-static><h1>x</h1>'
        ),
      /must not contain an <h1>/
    ],
    [
      'placeholder text',
      (html: string) =>
        html.replace(
          '<nav aria-label="Breadcrumb">',
          '<p>undefined</p><nav aria-label="Breadcrumb">'
        ),
      /placeholder/
    ],
    [
      'a wrong html lang',
      (html: string) => html.replace('<html lang="en">', '<html lang="de">'),
      /html lang/
    ],
    [
      'a mismatched og:url',
      (html: string) =>
        html.replace(
          /(property="og:url" content=")[^"]+/,
          '$1https://orvulix.io.vn/other'
        ),
      /og:url must equal/
    ],
    [
      'a summary card',
      (html: string) => html.replace('summary_large_image', 'summary'),
      /summary_large_image/
    ],
    [
      'duplicated static content',
      (html: string) =>
        html.replace('</body>', '<div data-seo-static></div></body>'),
      /exactly once/
    ]
  ])('rejects %s', async (_name, mutate, message) => {
    const site = await load();
    const page = resolveSeoPage(site, '/json/prettify');
    const problems = validateRouteHtml(
      mutate(renderDocument(TEMPLATE, page)),
      page,
      SITE,
      'x'
    );
    expect(problems.join('\n')).toMatch(message);
  });

  it('rejects canonical or social tags on the 404 page', async () => {
    const site = await load();
    const html = renderDocument(TEMPLATE, site.notFound).replace(
      '</head>',
      '<link rel="canonical" href="https://orvulix.io.vn/" /><meta property="og:title" content="x" /></head>'
    );
    const problems = validateRouteHtml(html, site.notFound, SITE, '404').join(
      '\n'
    );
    expect(problems).toMatch(/must not have a canonical/);
    expect(problems).toMatch(/must not have social tags/);
  });
});
