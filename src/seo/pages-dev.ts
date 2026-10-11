import type { HeadTag } from './types';

/** Pages is a public dev environment, not a second search-indexable website. */
export function developmentHeadTags(tags: HeadTag[]): HeadTag[] {
  return tags
    .filter(
      (tag) =>
        tag.attrs.rel !== 'canonical' &&
        tag.attrs.property !== 'og:url' &&
        tag.attrs.property !== 'og:image' &&
        tag.attrs.name !== 'twitter:image' &&
        tag.attrs.type !== 'application/ld+json'
    )
    .map((tag) =>
      tag.attrs.name === 'robots'
        ? { ...tag, attrs: { ...tag.attrs, content: 'noindex, follow' } }
        : tag
    );
}
