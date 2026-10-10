import { SITE, absoluteUrl } from './config';
import type { SeoLink } from './types';

/**
 * schema.org JSON-LD builders. Only verifiable facts are emitted: no ratings,
 * reviews, prices, legal-entity details or SearchAction.
 */

const WEBSITE_ID = `${SITE.origin}/#website`;
const ORGANIZATION_ID = `${SITE.origin}/#organization`;

const breadcrumbNode = (url: string, crumbs: SeoLink[]) => ({
  '@type': 'BreadcrumbList',
  '@id': `${url}#breadcrumb`,
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: absoluteUrl(crumb.path)
  }))
});

const graph = (nodes: Record<string, unknown>[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodes
});

export const homeJsonLd = (description: string, language: string) =>
  graph([
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE.name,
      url: absoluteUrl('/'),
      description,
      inLanguage: language,
      publisher: { '@id': ORGANIZATION_ID }
    },
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE.name,
      url: absoluteUrl('/'),
      logo: absoluteUrl(SITE.logoPath),
      email: SITE.contactEmail,
      sameAs: [SITE.repositoryUrl]
    }
  ]);

export const infoJsonLd = (args: {
  schemaType: string;
  url: string;
  title: string;
  description: string;
  language: string;
  breadcrumbs: SeoLink[];
}) =>
  graph([
    {
      '@type': args.schemaType,
      '@id': `${args.url}#webpage`,
      url: args.url,
      name: args.title,
      description: args.description,
      inLanguage: args.language,
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: { '@id': `${args.url}#breadcrumb` }
    },
    breadcrumbNode(args.url, args.breadcrumbs)
  ]);

export const categoryJsonLd = (args: {
  url: string;
  title: string;
  description: string;
  language: string;
  breadcrumbs: SeoLink[];
  tools: SeoLink[];
}) =>
  graph([
    {
      '@type': 'CollectionPage',
      '@id': `${args.url}#webpage`,
      url: args.url,
      name: args.title,
      description: args.description,
      inLanguage: args.language,
      isPartOf: { '@id': WEBSITE_ID },
      breadcrumb: { '@id': `${args.url}#breadcrumb` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: args.tools.length,
        itemListElement: args.tools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          url: absoluteUrl(tool.path)
        }))
      }
    },
    breadcrumbNode(args.url, args.breadcrumbs)
  ]);

const DEVELOPER_CATEGORIES = new Set(['json', 'csv', 'xml']);
const MULTIMEDIA_CATEGORIES = new Set([
  'image-generic',
  'png',
  'gif',
  'video',
  'audio'
]);

export const applicationCategory = (category: string): string =>
  DEVELOPER_CATEGORIES.has(category)
    ? 'DeveloperApplication'
    : MULTIMEDIA_CATEGORIES.has(category)
      ? 'MultimediaApplication'
      : 'UtilitiesApplication';

export const toolJsonLd = (args: {
  url: string;
  name: string;
  description: string;
  category: string;
  language: string;
  breadcrumbs: SeoLink[];
}) =>
  graph([
    {
      '@type': 'WebApplication',
      '@id': `${args.url}#app`,
      name: args.name,
      url: args.url,
      description: args.description,
      applicationCategory: applicationCategory(args.category),
      browserRequirements: 'Requires JavaScript.',
      isAccessibleForFree: true,
      inLanguage: args.language,
      isPartOf: { '@id': WEBSITE_ID }
    },
    breadcrumbNode(args.url, args.breadcrumbs)
  ]);
