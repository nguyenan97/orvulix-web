import { LIMITS, SITE, absoluteUrl } from './config';
import { buildToolSections } from './content';
import { categoryJsonLd, homeJsonLd, infoJsonLd, toolJsonLd } from './jsonld';
import {
  CATEGORY_SEO_OVERRIDES,
  HOME_SEO,
  INFO_PAGES_SEO,
  NOT_FOUND_SEO
} from './pages';
import {
  categorySubject,
  composeDescription,
  composeTitle,
  ensureSentence,
  leadingSentences,
  normalizeWhitespace
} from './text';
import type {
  SeoLink,
  SeoPage,
  SeoSite,
  ToolRecord,
  ToolSeoOverride,
  Translate
} from './types';

/** Locale-independent ordering, identical in Node and every browser. */
const compareText = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

export interface SeoInput {
  tools: ToolRecord[];
  translate: Translate;
  language: string;
  overrides: Record<string, ToolSeoOverride>;
}

export interface SeoBuildResult {
  site: SeoSite;
  /** Problems that make the metadata invalid; the build must fail on any. */
  issues: string[];
  /** The subset of issues caused by missing strings (e.g. a failed load). */
  missingText: string[];
}

const categoryTitleKey = (category: string) =>
  `translation:categories.${category}.title`;
const categoryDescriptionKey = (category: string) =>
  `translation:categories.${category}.description`;

export const categoryPath = (category: string) => `/categories/${category}`;
export const toolPath = (tool: ToolRecord) => `/${tool.path}`;

/** Normalizes a location pathname to the canonical route path form. */
export const normalizePath = (pathname: string): string => {
  const path = pathname.split(/[?#]/)[0] || '/';
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return trimmed || '/';
};

/** "text " for a known category subject, empty otherwise. */
const subjectWord = (subject?: string) => (subject ? `${subject} ` : '');

const toolSuffixes = (subject?: string) => [
  `A free online ${subjectWord(
    subject
  )}tool from Orvulix, available in your web browser with no account or installation required.`,
  `A free online ${subjectWord(
    subject
  )}tool from Orvulix with no account or installation required.`,
  `Free online ${subjectWord(subject)}tool from Orvulix, no sign-up required.`,
  `Free online ${subjectWord(subject)}tool from Orvulix.`
];

const categorySuffixes = (subject?: string) => [
  `Browse free online ${subjectWord(
    subject
  )}tools from Orvulix, available in your web browser with no account or installation required.`,
  `Browse free online ${subjectWord(
    subject
  )}tools from Orvulix with no account required.`,
  `Free online ${subjectWord(subject)}tools from Orvulix.`
];

/**
 * Description for non-English client metadata: whole leading sentences or
 * the full text. Editorial limits only apply to the indexed English HTML.
 */
const localDescription = (...texts: string[]): string => {
  for (const text of texts) {
    const sentence = ensureSentence(text);
    if (sentence)
      return leadingSentences(sentence, LIMITS.descriptionMax) || sentence;
  }
  return '';
};

const basePage = (
  page: Omit<SeoPage, 'robots' | 'indexable' | 'canonical'> & {
    indexable: boolean;
  }
): SeoPage => ({
  ...page,
  canonical: page.indexable ? absoluteUrl(page.path) : null,
  robots: page.indexable ? SITE.robotsIndex : SITE.robotsNoIndex
});

/**
 * Builds SEO metadata for every route from tool metadata, locale strings,
 * page definitions and overrides. The build-time generator and the client
 * both call this function, so their output cannot drift apart.
 */
export const buildSeoSite = (input: SeoInput): SeoBuildResult => {
  const { language, translate, overrides } = input;
  const english = language === SITE.language;
  const issues: string[] = [];
  const missingText: string[] = [];

  const text = (key: string, route: string): string => {
    const value = translate(key);
    if (typeof value !== 'string' || !normalizeWhitespace(value)) {
      const issue = `Missing text for i18n key "${key}" (route ${route}).`;
      issues.push(issue);
      missingText.push(issue);
      return '';
    }
    return normalizeWhitespace(value);
  };

  const home: SeoLink = { name: SITE.name, path: '/' };
  const pages: SeoPage[] = [];

  const tools = [...input.tools].sort((a, b) => compareText(a.path, b.path));
  const seenPaths = new Set<string>();
  for (const tool of tools) {
    if (seenPaths.has(tool.path)) {
      issues.push(`Duplicate tool route /${tool.path}.`);
    }
    seenPaths.add(tool.path);
  }
  for (const path of Object.keys(overrides)) {
    if (!seenPaths.has(path)) {
      issues.push(`SEO override "${path}" does not match any tool route.`);
    }
  }

  const categories = [...new Set(tools.map((tool) => tool.category))].sort();
  for (const category of Object.keys(CATEGORY_SEO_OVERRIDES)) {
    if (!categories.includes(category)) {
      issues.push(
        `Category SEO override "${category}" does not match any category.`
      );
    }
  }
  const categoryInfo = new Map(
    categories.map((category) => {
      const route = categoryPath(category);
      const title = text(categoryTitleKey(category), route);
      // Subject words ("Text" from "Text Tools") enrich English templates;
      // titles without the "Tools" suffix fall back to generic wording.
      const subject = english ? categorySubject(title) : null;
      return [
        category,
        {
          title,
          description: text(categoryDescriptionKey(category), route),
          subject
        }
      ] as const;
    })
  );

  const toolLinks = tools.map((tool) => ({
    tool,
    link: {
      name: text(tool.nameKey, toolPath(tool)),
      path: toolPath(tool),
      description: text(tool.shortDescriptionKey, toolPath(tool))
    }
  }));

  const homeLinks: SeoLink[] = [];
  for (const category of categories) {
    const info = categoryInfo.get(category)!;
    const path = categoryPath(category);
    const url = absoluteUrl(path);
    const override = english ? CATEGORY_SEO_OVERRIDES[category] : undefined;
    const title = override?.title
      ? normalizeWhitespace(override.title)
      : english
        ? composeTitle([
            `Free Online ${info.title} | ${SITE.name}`,
            `${info.title} | ${SITE.name}`
          ])
        : `${info.title} | ${SITE.name}`;
    const description = override?.description
      ? normalizeWhitespace(override.description)
      : english
        ? composeDescription(
            [info.description],
            categorySuffixes(info.subject?.lower)
          )
        : localDescription(info.description);
    if (!title) {
      issues.push(
        `Cannot build a title within ${LIMITS.titleMax} characters for ${path}; add a category override in src/seo/pages.ts.`
      );
    }
    if (!description) {
      issues.push(
        `Cannot build a description of ${LIMITS.descriptionMin}-${LIMITS.descriptionMax} characters for ${path}; add a category override in src/seo/pages.ts.`
      );
    }
    const links = toolLinks
      .filter(({ tool }) => tool.category === category)
      .map(({ link }) => link)
      .sort((a, b) => compareText(a.name, b.name));
    const breadcrumbs = [home, { name: info.title, path }];
    homeLinks.push({ name: info.title, path, description: info.description });
    pages.push(
      basePage({
        kind: 'category',
        path,
        indexable: true,
        language,
        title: title ?? '',
        description: description ?? '',
        heading: info.title,
        intro: info.description,
        breadcrumbs,
        linksHeading: info.title,
        links,
        sections: [],
        jsonLd: categoryJsonLd({
          url,
          title: title ?? '',
          description: description ?? '',
          language,
          breadcrumbs,
          tools: links
        })
      })
    );
  }

  for (const { tool, link } of toolLinks) {
    const path = toolPath(tool);
    const url = absoluteUrl(path);
    const info = categoryInfo.get(tool.category)!;
    const subject = info.subject;
    const fullDescription = text(tool.descriptionKey, path);
    const override = english ? overrides[tool.path] : undefined;
    const title = override
      ? normalizeWhitespace(override.title)
      : english
        ? composeTitle(
            subject
              ? [
                  `${link.name} - Free Online ${subject.title} Tool | ${SITE.name}`,
                  `${link.name} - Free ${subject.title} Tool | ${SITE.name}`,
                  `${link.name} | ${SITE.name}`
                ]
              : [
                  `${link.name} - Free Online Tool | ${SITE.name}`,
                  `${link.name} | ${SITE.name}`
                ]
          )
        : composeTitle([`${link.name} - ${info.title} | ${SITE.name}`]) ??
          `${link.name} | ${SITE.name}`;
    const description = override
      ? normalizeWhitespace(override.description)
      : english
        ? composeDescription(
            [fullDescription, link.description ?? ''],
            toolSuffixes(subject?.lower)
          )
        : localDescription(fullDescription, link.description ?? '');
    if (!title)
      issues.push(
        `Cannot build a title within ${LIMITS.titleMax} characters for ${path}; add an SEO override.`
      );
    if (!description)
      issues.push(
        `Cannot build a description of ${LIMITS.descriptionMin}-${LIMITS.descriptionMax} characters for ${path}; add an SEO override.`
      );
    const breadcrumbs = [
      home,
      { name: info.title, path: categoryPath(tool.category) },
      { name: link.name, path }
    ];
    pages.push(
      basePage({
        kind: 'tool',
        path,
        indexable: true,
        language,
        title: title ?? '',
        description: description ?? '',
        heading: link.name,
        intro: fullDescription,
        breadcrumbs,
        linksHeading: english ? `More ${info.title}` : info.title,
        links: toolLinks
          .filter(
            (other) =>
              other.tool.category === tool.category && other.tool !== tool
          )
          .map((other) => other.link)
          .sort((a, b) => compareText(a.name, b.name)),
        sections: override ? buildToolSections(link.name, override) : [],
        jsonLd: toolJsonLd({
          url,
          name: link.name,
          description: description ?? '',
          category: tool.category,
          language,
          breadcrumbs
        })
      })
    );
  }

  for (const [path, seo] of Object.entries(INFO_PAGES_SEO)) {
    const url = absoluteUrl(path);
    const breadcrumbs = [home, { name: seo.heading, path }];
    pages.push(
      basePage({
        kind: 'info',
        path,
        indexable: true,
        language: SITE.language,
        title: seo.title,
        description: seo.description,
        heading: seo.heading,
        intro: seo.intro,
        breadcrumbs,
        linksHeading: '',
        links: [],
        sections: [],
        jsonLd: infoJsonLd({
          schemaType: seo.schemaType,
          url,
          title: seo.title,
          description: seo.description,
          language: SITE.language,
          breadcrumbs
        })
      })
    );
  }

  pages.push(
    basePage({
      kind: 'home',
      path: '/',
      indexable: true,
      language: SITE.language,
      title: HOME_SEO.title,
      description: HOME_SEO.description,
      heading: HOME_SEO.heading,
      intro: HOME_SEO.intro,
      breadcrumbs: [],
      linksHeading: HOME_SEO.linksHeading,
      links: homeLinks,
      sections: [],
      jsonLd: homeJsonLd(HOME_SEO.description, SITE.language)
    })
  );

  const notFound = basePage({
    kind: 'not-found',
    path: '/404',
    indexable: false,
    language: SITE.language,
    title: NOT_FOUND_SEO.title,
    description: NOT_FOUND_SEO.description,
    heading: NOT_FOUND_SEO.heading,
    intro: NOT_FOUND_SEO.intro,
    breadcrumbs: [],
    linksHeading: '',
    links: [home],
    sections: [],
    jsonLd: null
  });

  pages.sort((a, b) => compareText(a.path, b.path));
  return { site: { language, pages, notFound }, issues, missingText };
};

/** Finds the SEO page for a location pathname, falling back to not-found. */
export const resolveSeoPage = (site: SeoSite, pathname: string): SeoPage => {
  const path = normalizePath(pathname);
  return site.pages.find((page) => page.path === path) ?? site.notFound;
};
