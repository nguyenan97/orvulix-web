import { SITE, absoluteUrl } from './config';
import { escapeHtml, serializeJsonLd } from './text';
import type { HeadTag, SeoPage } from './types';

/** Attribute marking head elements owned by the SEO layer. */
export const SEO_ATTRIBUTE = 'data-seo';

/**
 * Selectors for every head element the SEO layer owns. Elements matching
 * them are replaced as a whole, so metadata from a previous route or from
 * the HTML template can never survive next to the current values.
 */
export const MANAGED_HEAD_SELECTORS = [
  `[${SEO_ATTRIBUTE}]`,
  'meta[name="description"]',
  'meta[name="robots"]',
  'link[rel="canonical"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'script[type="application/ld+json"]'
];

const meta = (attrs: Record<string, string>): HeadTag => ({
  tag: 'meta',
  attrs: { ...attrs, [SEO_ATTRIBUTE]: '' }
});

const imageUrl = absoluteUrl(SITE.image.path);

/** Head elements for a page, in document order (title first). */
export const getHeadTags = (page: SeoPage): HeadTag[] => {
  const tags: HeadTag[] = [
    { tag: 'title', attrs: {}, text: page.title },
    meta({ name: 'description', content: page.description }),
    meta({ name: 'robots', content: page.robots })
  ];
  if (page.canonical) {
    tags.push(
      {
        tag: 'link',
        attrs: { rel: 'canonical', href: page.canonical, [SEO_ATTRIBUTE]: '' }
      },
      meta({ property: 'og:type', content: 'website' }),
      meta({ property: 'og:site_name', content: SITE.name }),
      meta({ property: 'og:title', content: page.title }),
      meta({ property: 'og:description', content: page.description }),
      meta({ property: 'og:url', content: page.canonical }),
      meta({ property: 'og:image', content: imageUrl }),
      meta({ property: 'og:image:width', content: String(SITE.image.width) }),
      meta({ property: 'og:image:height', content: String(SITE.image.height) }),
      meta({ property: 'og:image:type', content: SITE.image.type }),
      meta({ property: 'og:image:alt', content: SITE.image.alt }),
      meta({ name: 'twitter:card', content: 'summary_large_image' }),
      meta({ name: 'twitter:title', content: page.title }),
      meta({ name: 'twitter:description', content: page.description }),
      meta({ name: 'twitter:image', content: imageUrl }),
      meta({ name: 'twitter:image:alt', content: SITE.image.alt })
    );
  }
  if (page.jsonLd) {
    tags.push({
      tag: 'script',
      attrs: { type: 'application/ld+json', [SEO_ATTRIBUTE]: '' },
      text: serializeJsonLd(page.jsonLd)
    });
  }
  return tags;
};

const renderAttrs = (attrs: Record<string, string>): string =>
  Object.entries(attrs)
    .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
    .join('');

/** Serializes head tags to HTML. JSON-LD text is already script-safe. */
export const renderHeadTags = (tags: HeadTag[]): string =>
  tags
    .map((tag) => {
      if (tag.tag === 'title')
        return `<title>${escapeHtml(tag.text ?? '')}</title>`;
      if (tag.tag === 'script') {
        return `<script${renderAttrs(tag.attrs)}>${tag.text ?? ''}</script>`;
      }
      return `<${tag.tag}${renderAttrs(tag.attrs)} />`;
    })
    .join('\n  ');
