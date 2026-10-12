import { beforeEach, describe, expect, it } from 'vitest';
import { discoverTools } from '../../scripts/seo/discover.mjs';
import { applyHeadTags } from './dom';
import { getHeadTags, renderHeadTags } from './head';
import { buildSeoSite, resolveSeoPage } from './model';

const site = async () => {
  const { tools, translate } = await discoverTools();
  return buildSeoSite({ tools, translate, language: 'en', overrides: {} }).site;
};

const managed = () =>
  [
    ...document.head.querySelectorAll(
      'meta[name="description"],meta[name="robots"],link[rel="canonical"],meta[property^="og:"],meta[name^="twitter:"],script[type="application/ld+json"]'
    )
  ].map((element) => element.outerHTML);

describe('applyHeadTags', () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<meta name="description" content="template"><link rel="canonical" href="https://orvulix.io.vn/"><script type="application/ld+json">{"template":true}</script><meta name="theme-color" content="#0F766E">';
    document.documentElement.lang = 'xx';
  });

  it('replaces template metadata and leaves unrelated tags alone', async () => {
    const page = resolveSeoPage(await site(), '/string/uppercase');
    applyHeadTags(document, getHeadTags(page), page.language);
    expect(document.title).toBe(page.title);
    expect(document.documentElement.lang).toBe('en');
    expect(
      document.head.querySelectorAll('link[rel="canonical"]')
    ).toHaveLength(1);
    expect(
      document.head.querySelector('link[rel="canonical"]')!.getAttribute('href')
    ).toBe(page.canonical);
    expect(
      document.head.querySelectorAll('meta[name="description"]')
    ).toHaveLength(1);
    expect(
      document.head.querySelectorAll('script[type="application/ld+json"]')
    ).toHaveLength(1);
    expect(
      document.head.querySelector('meta[name="theme-color"]')
    ).not.toBeNull();
  });

  it('leaves no metadata from the previous route after navigation', async () => {
    const seo = await site();
    const first = resolveSeoPage(seo, '/string/uppercase');
    const second = resolveSeoPage(seo, '/categories/json');
    applyHeadTags(document, getHeadTags(first), 'en');
    applyHeadTags(document, getHeadTags(second), 'en');
    const html = managed().join('\n');
    expect(html).not.toContain('/string/uppercase');
    expect(html).toContain(second.canonical!);
    const notFound = resolveSeoPage(seo, '/no/such/page');
    applyHeadTags(document, getHeadTags(notFound), 'en');
    expect(managed().join('\n')).not.toMatch(/canonical|og:|twitter:|ld\+json/);
    expect(
      document.head
        .querySelector('meta[name="robots"]')!
        .getAttribute('content')
    ).toMatch(/noindex/);
  });

  it('does not touch the head when it already matches the prerendered tags', async () => {
    const page = resolveSeoPage(await site(), '/categories/pdf');
    document.head.innerHTML = renderHeadTags(getHeadTags(page));
    const before = [...document.head.children];
    applyHeadTags(document, getHeadTags(page), 'en');
    const after = [...document.head.children];
    expect(after).toHaveLength(before.length);
    after.forEach((element, index) => expect(element).toBe(before[index]));
  });
});
