import { LIMITS, SITE, absoluteUrl } from './config';
import type { SeoPage, SeoSite } from './types';

// Signs of an interpolated missing value or an unresolved i18n template.
const PLACEHOLDER =
  /\bundefined\b|\bNaN\b|\[object Object\]|\{\{|\$t\(|\blorem ipsum\b|^null$/i;

const collectStrings = (value: unknown, out: string[] = []): string[] => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value))
    value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, out));
  }
  return out;
};

const pageTexts = (page: SeoPage): string[] =>
  collectStrings([
    page.title,
    page.description,
    page.heading,
    page.intro,
    page.breadcrumbs,
    page.links,
    page.sections,
    page.jsonLd
  ]);

/**
 * Validates the SEO model against the project's editorial rules. Returns a
 * list of human-readable problems, each naming the affected route.
 */
export const validateSeoSite = (site: SeoSite): string[] => {
  const problems: string[] = [];
  const indexable = site.pages.filter((page) => page.indexable);
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const paths = new Set<string>();

  for (const page of site.pages) {
    const at = `route ${page.path}`;
    if (paths.has(page.path)) problems.push(`Duplicate ${at}.`);
    paths.add(page.path);
    if (!/^\/(?:[A-Za-z0-9-]+(?:\/[A-Za-z0-9-]+)*)?$/.test(page.path)) {
      problems.push(`Invalid path format for ${at}.`);
    }
    if (!page.title) problems.push(`Empty title for ${at}.`);
    if (page.title.length > LIMITS.titleMax) {
      problems.push(
        `Title longer than ${LIMITS.titleMax} characters for ${at}: "${page.title}" (${page.title.length}).`
      );
    }
    if (
      page.description.length < LIMITS.descriptionMin ||
      page.description.length > LIMITS.descriptionMax
    ) {
      problems.push(
        `Description must be ${LIMITS.descriptionMin}-${LIMITS.descriptionMax} characters for ${at}: "${page.description}" (${page.description.length}).`
      );
    }
    if (!page.heading) problems.push(`Empty heading for ${at}.`);
    for (const text of pageTexts(page)) {
      if (PLACEHOLDER.test(text)) {
        problems.push(
          `Placeholder-like text for ${at}: "${text.slice(0, 80)}".`
        );
      }
    }
    if (page.indexable) {
      if (page.canonical !== absoluteUrl(page.path)) {
        problems.push(`Canonical for ${at} must be ${absoluteUrl(page.path)}.`);
      }
      if (page.robots !== SITE.robotsIndex)
        problems.push(`Unexpected robots for ${at}.`);
      if (!page.jsonLd) problems.push(`Missing JSON-LD for ${at}.`);
      const titleOwner = titles.get(page.title);
      if (titleOwner)
        problems.push(
          `Title of ${at} duplicates ${titleOwner}: "${page.title}".`
        );
      titles.set(page.title, page.path);
      const descriptionOwner = descriptions.get(page.description);
      if (descriptionOwner) {
        problems.push(`Description of ${at} duplicates ${descriptionOwner}.`);
      }
      descriptions.set(page.description, page.path);
    }
    for (const link of [...page.links, ...page.breadcrumbs]) {
      if (
        link.path !== '/' &&
        !site.pages.some((other) => other.path === link.path)
      ) {
        problems.push(`Link from ${at} points to unknown route ${link.path}.`);
      }
    }
    for (const text of collectStrings(page.jsonLd)) {
      if (
        /^https?:/.test(text) &&
        !text.startsWith(`${SITE.origin}/`) &&
        ![SITE.repositoryUrl, 'https://schema.org'].includes(text)
      ) {
        problems.push(
          `JSON-LD of ${at} references an unexpected URL: ${text}.`
        );
      }
    }
  }

  const notFound = site.notFound;
  if (
    notFound.indexable ||
    notFound.canonical ||
    !/noindex/.test(notFound.robots)
  ) {
    problems.push(
      'The not-found page must be noindex without a canonical URL.'
    );
  }
  if (!indexable.some((page) => page.kind === 'home'))
    problems.push('Missing home page.');
  return problems;
};
