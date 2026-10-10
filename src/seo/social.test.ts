import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pngSize } from '../../scripts/seo/validate-dist.mjs';
import { SITE } from './config';
import { getHeadTags } from './head';
import { discoverTools } from '../../scripts/seo/discover.mjs';
import { buildSeoSite } from './model';

describe('social metadata', () => {
  it('declares the real dimensions of the default social image', () => {
    const size = pngSize(readFileSync(`public${SITE.image.path}`));
    expect(size).toEqual({
      width: SITE.image.width,
      height: SITE.image.height
    });
  });

  it('adds absolute HTTPS image tags and a large card to every indexable page', async () => {
    const { tools, translate } = await discoverTools();
    const { site } = buildSeoSite({
      tools,
      translate,
      language: 'en',
      overrides: {}
    });
    for (const page of site.pages) {
      const attrs = getHeadTags(page).map((tag) => tag.attrs);
      const value = (key: string, name: string) =>
        attrs.find((attr) => attr[key] === name)?.content;
      expect(value('property', 'og:image')).toBe(
        `${SITE.origin}${SITE.image.path}`
      );
      expect(value('property', 'og:image')).toMatch(/^https:\/\//);
      expect(value('name', 'twitter:image')).toBe(
        value('property', 'og:image')
      );
      expect(value('name', 'twitter:card')).toBe('summary_large_image');
      expect(value('property', 'og:image:alt')).toBeTruthy();
      expect(value('property', 'og:image:width')).toBe(
        String(SITE.image.width)
      );
      expect(value('property', 'og:image:height')).toBe(
        String(SITE.image.height)
      );
    }
  });

  it('rejects files that are not PNG images', () => {
    expect(pngSize(Buffer.from('not an image'))).toBeNull();
  });
});
