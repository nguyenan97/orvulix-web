import { describe, expect, it } from 'vitest';
import { developmentHeadTags } from './pages-dev';
import { applyHeadTags } from './dom';
import type { HeadTag } from './types';

describe('Pages development metadata', () => {
  it('keeps noindex after navigation and removes production identity without mutating input', () => {
    const tags: HeadTag[] = [
      { tag: 'title', attrs: {}, text: 'Tool' },
      { tag: 'meta', attrs: { name: 'robots', content: 'index, follow' } },
      {
        tag: 'link',
        attrs: { rel: 'canonical', href: 'https://orvulix.io.vn/' }
      },
      {
        tag: 'meta',
        attrs: { property: 'og:url', content: 'https://orvulix.io.vn/' }
      },
      { tag: 'script', attrs: { type: 'application/ld+json' }, text: '{}' }
    ];
    document.head.innerHTML = '';
    applyHeadTags(document, developmentHeadTags(tags), 'en');
    applyHeadTags(
      document,
      developmentHeadTags([
        ...tags,
        { tag: 'meta', attrs: { name: 'description', content: 'Next tool' } }
      ]),
      'en'
    );
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute('content')
    ).toBe('noindex, follow');
    expect(
      document.querySelector(
        'link[rel="canonical"],meta[property="og:url"],script[type="application/ld+json"]'
      )
    ).toBeNull();
    expect(tags[1].attrs.content).toBe('index, follow');
  });
});
