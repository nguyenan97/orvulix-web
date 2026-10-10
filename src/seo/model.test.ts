import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import i18next from 'i18next';
import { tools } from '@tools/index';
import { discoverTools } from '../../scripts/seo/discover.mjs';
import { LIMITS, SITE } from './config';
import { getHeadTags, renderHeadTags } from './head';
import { buildSeoSite, normalizePath, resolveSeoPage } from './model';
import { TOOL_OVERRIDES } from './overrides';
import { toolRecordsFromRegistry } from './records';
import { renderDocument } from './static-html';
import { serializeJsonLd } from './text';
import type { SeoPage } from './types';
import { validateSeoSite } from './validate';

const englishResources = () =>
  Object.fromEntries(
    readdirSync('public/locales/en')
      .filter((file) => file.endsWith('.json'))
      .map((file) => [
        file.slice(0, -5),
        JSON.parse(readFileSync(`public/locales/en/${file}`, 'utf8'))
      ])
  );

/** Same translate function as RouteSeo, backed by a real i18next instance. */
const clientTranslate = async () => {
  const instance = i18next.createInstance();
  const resources = englishResources();
  await instance.init({
    lng: 'en',
    fallbackLng: 'en',
    ns: Object.keys(resources),
    resources: { en: resources },
    interpolation: { escapeValue: false }
  });
  const t = instance.getFixedT('en') as unknown as (key: string) => string;
  return (key: string) =>
    instance.exists(key, { lng: 'en' }) ? t(key) : undefined;
};

const buildTimeSite = async () => {
  const { tools: discovered, translate } = await discoverTools();
  return buildSeoSite({
    tools: discovered,
    translate,
    language: 'en',
    overrides: TOOL_OVERRIDES
  });
};

describe('SEO model', () => {
  it('produces identical metadata at build time and in the client', async () => {
    const build = await buildTimeSite();
    const client = buildSeoSite({
      tools: toolRecordsFromRegistry(tools),
      translate: await clientTranslate(),
      language: 'en',
      overrides: TOOL_OVERRIDES
    });
    expect(build.issues).toEqual([]);
    expect(client.issues).toEqual([]);
    expect(client.site).toEqual(build.site);
  });

  it('passes validation for every indexable route', async () => {
    const { site, issues } = await buildTimeSite();
    expect(issues).toEqual([]);
    expect(validateSeoSite(site)).toEqual([]);
    const indexable = site.pages.filter((page) => page.indexable);
    expect(new Set(indexable.map((page) => page.title)).size).toBe(
      indexable.length
    );
    expect(new Set(indexable.map((page) => page.description)).size).toBe(
      indexable.length
    );
    for (const page of indexable) {
      expect(page.title.length).toBeLessThanOrEqual(LIMITS.titleMax);
      expect(page.description.length).toBeGreaterThanOrEqual(
        LIMITS.descriptionMin
      );
      expect(page.description.length).toBeLessThanOrEqual(
        LIMITS.descriptionMax
      );
      expect(page.canonical).toBe(
        page.path === '/' ? `${SITE.origin}/` : `${SITE.origin}${page.path}`
      );
    }
  });

  it('keeps generated descriptions made of whole sentences', async () => {
    const { site } = await buildTimeSite();
    for (const page of site.pages.filter((item) => item.kind === 'tool')) {
      expect(page.description).toMatch(/[.!?]["')\]]?$/);
    }
  });

  it('reports tools whose metadata cannot satisfy the limits', () => {
    const { issues } = buildSeoSite({
      tools: [
        {
          category: 'string',
          path: 'string/long',
          nameKey: 'string:long.title',
          descriptionKey: 'string:long.description',
          shortDescriptionKey: 'string:long.short'
        }
      ],
      translate: (key) =>
        ({
          'string:long.title':
            'A tool name that is far too long to ever fit into a sixty character title',
          'string:long.description': 'Short.',
          'string:long.short': 'Short.',
          'translation:categories.string.title': 'Text Tools',
          'translation:categories.string.description':
            'Tools for working with text, from case conversion to encoding, splitting, joining and many other everyday text tasks online.'
        })[key],
      language: 'en',
      overrides: {}
    });
    expect(issues.join('\n')).toMatch(
      /title within 60 characters for \/string\/long/
    );
  });

  it('reports missing translations with the key and route', () => {
    const { issues } = buildSeoSite({
      tools: [
        {
          category: 'string',
          path: 'string/x',
          nameKey: 'string:x.title',
          descriptionKey: 'string:x.description',
          shortDescriptionKey: 'string:x.short'
        }
      ],
      translate: () => undefined,
      language: 'en',
      overrides: {}
    });
    expect(issues).toContain(
      'Missing text for i18n key "string:x.title" (route /string/x).'
    );
  });

  it('does not mix English template words into other languages', () => {
    const german: Record<string, string> = {
      'string:x.title': 'Großbuchstaben',
      'string:x.description': 'Text in Großbuchstaben umwandeln.',
      'string:x.short': 'In Großbuchstaben umwandeln',
      'translation:categories.string.title': 'Text-Werkzeuge',
      'translation:categories.string.description': 'Werkzeuge für Text.'
    };
    const { site } = buildSeoSite({
      tools: [
        {
          category: 'string',
          path: 'string/x',
          nameKey: 'string:x.title',
          descriptionKey: 'string:x.description',
          shortDescriptionKey: 'string:x.short'
        }
      ],
      translate: (key) => german[key],
      language: 'de',
      overrides: TOOL_OVERRIDES
    });
    const category = resolveSeoPage(site, '/categories/string');
    const tool = resolveSeoPage(site, '/string/x');
    expect(category.title).toBe('Text-Werkzeuge | Orvulix');
    expect(tool.title).toBe('Großbuchstaben - Text-Werkzeuge | Orvulix');
    expect(`${category.title} ${tool.title} ${tool.description}`).not.toMatch(
      /Free Online|no sign-up|no account/
    );
    expect(tool.language).toBe('de');
    expect(tool.sections).toEqual([]);
  });

  it('builds client metadata without issues for every UI language', async () => {
    const { tools: discovered } = await discoverTools();
    const english = englishResources();
    for (const language of readdirSync('public/locales')) {
      const resources = Object.fromEntries(
        readdirSync(`public/locales/${language}`)
          .filter((file) => file.endsWith('.json'))
          .map((file) => [
            file.slice(0, -5),
            JSON.parse(
              readFileSync(`public/locales/${language}/${file}`, 'utf8')
            )
          ])
      );
      const instance = i18next.createInstance();
      await instance.init({
        lng: language,
        fallbackLng: 'en',
        ns: Object.keys(english),
        resources: { en: english, [language]: resources },
        interpolation: { escapeValue: false }
      });
      const t = instance.getFixedT(language) as unknown as (
        key: string
      ) => string;
      const { issues, site } = buildSeoSite({
        tools: discovered,
        translate: (key) =>
          instance.exists(key, { lng: language }) ? t(key) : undefined,
        language,
        overrides: TOOL_OVERRIDES
      });
      expect(issues, language).toEqual([]);
      expect(
        site.pages.every((page) => page.title && page.description),
        language
      ).toBe(true);
    }
  });

  it('falls back to generic wording when a category title has no "Tools" suffix', () => {
    const strings: Record<string, string> = {
      'xml:x.title': 'XML Formatter',
      'xml:x.description':
        'Format and indent XML documents for easier reading.',
      'xml:x.short': 'Format XML',
      'translation:categories.xml.title': 'XML Utilities',
      'translation:categories.xml.description':
        'Utilities for working with XML documents, from formatting and validation to conversion between XML and other data formats.'
    };
    const { site, issues } = buildSeoSite({
      tools: [
        {
          category: 'xml',
          path: 'xml/x',
          nameKey: 'xml:x.title',
          descriptionKey: 'xml:x.description',
          shortDescriptionKey: 'xml:x.short'
        }
      ],
      translate: (key) => strings[key],
      language: 'en',
      overrides: {}
    });
    expect(issues).toEqual([]);
    expect(resolveSeoPage(site, '/xml/x').title).toBe(
      'XML Formatter - Free Online Tool | Orvulix'
    );
    expect(resolveSeoPage(site, '/xml/x').description).toMatch(
      /^Format and indent XML documents for easier reading\. A free online tool from Orvulix/
    );
  });

  it('resolves location paths to canonical routes', async () => {
    const { site } = await buildTimeSite();
    const tool = site.pages.find((page) => page.kind === 'tool')!;
    expect(resolveSeoPage(site, `${tool.path}/`).path).toBe(tool.path);
    expect(resolveSeoPage(site, `${tool.path}?a=1#b`).path).toBe(tool.path);
    expect(resolveSeoPage(site, '/missing/route').kind).toBe('not-found');
    expect(resolveSeoPage(site, '/categories/unknown').kind).toBe('not-found');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('SEO HTML rendering', () => {
  const hostile: SeoPage = {
    kind: 'tool',
    path: '/string/x',
    canonical: `${SITE.origin}/string/x`,
    indexable: true,
    language: 'en',
    title: 'Tom & "Jerry" <b>',
    description: "It's </script><script>alert(1)</script> & more",
    robots: SITE.robotsIndex,
    heading: '<img src=x onerror=alert(1)>',
    intro: 'a < b & c > d',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'x"><script>', path: '/string/x' }
    ],
    linksHeading: '',
    links: [],
    sections: [],
    jsonLd: { name: '</script><!-- &  ' }
  };
  const template =
    '<!doctype html><html lang="xx"><head><title>Old</title><meta name="description" content="old" /><link rel="canonical" href="https://example.com/" /><script type="application/ld+json">{"old":true}</script></head><body><div id="root"></div></body></html>';

  it('escapes text, attributes and JSON-LD', () => {
    const html = renderDocument(template, hostile);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain(
      '<title>Tom &amp; &quot;Jerry&quot; &lt;b&gt;</title>'
    );
    const jsonLd =
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(
        html
      )![1];
    expect(jsonLd).not.toMatch(/<\/script|<!--/i);
    expect(JSON.parse(jsonLd)).toEqual(hostile.jsonLd);
    expect(serializeJsonLd(' ')).toBe('"\\u2028"');
  });

  it('replaces template metadata so every managed tag appears once', () => {
    const html = renderDocument(template, hostile);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html.match(/application\/ld\+json/g)).toHaveLength(1);
    expect(html).not.toContain('example.com');
    expect(html).toContain('<html lang="en">');
    expect(html.match(/<h1>/g)).toHaveLength(1);
  });

  it('inserts text containing replacement patterns literally', () => {
    const page = {
      ...hostile,
      intro: "Costs $& or $$ and $' or $`",
      sections: [
        { heading: 'Price $&', kind: 'list' as const, items: ["$' and $$"] }
      ],
      jsonLd: { name: "$& $' $$" }
    };
    const html = renderDocument(template, page);
    expect(html).toContain('<p>Costs $&amp; or $$ and $&#39; or $`</p>');
    expect(html).toContain('<h2>Price $&amp;</h2>');
    expect(html).toContain('<li>$&#39; and $$</li>');
    expect(html).toContain('"name":"$\\u0026 $\' $$"');
    expect(html.match(/<div id="root">/g)).toHaveLength(1);
  });

  it('keeps other attributes of the template <html> element', () => {
    const html = renderDocument(
      template.replace(
        '<html lang="xx">',
        '<html class="notranslate" translate="no" lang="xx">'
      ),
      hostile
    );
    expect(html).toContain(
      '<html class="notranslate" translate="no" lang="en">'
    );
    const withoutLang = renderDocument(
      template.replace('<html lang="xx">', '<html translate="no">'),
      hostile
    );
    expect(withoutLang).toContain('<html lang="en" translate="no">');
  });

  it('rejects templates without a single empty root element', () => {
    expect(() =>
      renderDocument('<html><head></head><body></body></html>', hostile)
    ).toThrow(/exactly one <div id="root"><\/div>/);
  });

  it('omits canonical and social tags on noindex pages', async () => {
    const { site } = await buildTimeSite();
    const head = renderHeadTags(getHeadTags(site.notFound));
    expect(head).toContain('noindex');
    expect(head).not.toMatch(/canonical|og:|twitter:|ld\+json/);
  });
});
