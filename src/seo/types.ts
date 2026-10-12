/**
 * Shared SEO types. This module (and everything under src/seo that is
 * imported by src/seo/node.ts) must stay free of React and browser APIs so
 * the build-time generator and the client can use exactly the same code.
 */

/** A tool route as discovered from tool metadata. */
export interface ToolRecord {
  /** Tool category, e.g. `string`. */
  category: string;
  /** Route path without leading slash, e.g. `string/uppercase`. */
  path: string;
  /** Full i18n keys, e.g. `string:uppercase.title`. */
  nameKey: string;
  descriptionKey: string;
  shortDescriptionKey: string;
}

/** Resolves a full i18n key (`namespace:dotted.key`) to a string. */
export type Translate = (key: string) => string | undefined;

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolExample {
  title: string;
  description: string;
}

/** Hand-written SEO metadata and content for one tool route. */
export interface ToolSeoOverride {
  title: string;
  description: string;
  /** Ordered steps describing how to use the tool. */
  howTo: string[];
  examples?: ToolExample[];
  /** Verified limitations and data-handling facts. */
  notes: string[];
  faq?: ToolFaq[];
}

export interface ContentSection {
  heading: string;
  kind: 'steps' | 'list' | 'examples' | 'faq';
  steps?: string[];
  items?: string[];
  examples?: ToolExample[];
  faq?: ToolFaq[];
}

export interface SeoLink {
  name: string;
  path: string;
  description?: string;
}

export type SeoPageKind = 'home' | 'info' | 'category' | 'tool' | 'not-found';

export interface SeoPage {
  kind: SeoPageKind;
  /** Route path with leading slash and without trailing slash (`/` for home). */
  path: string;
  /** Absolute canonical URL, or null when the page must not be indexed. */
  canonical: string | null;
  indexable: boolean;
  language: string;
  title: string;
  description: string;
  robots: string;
  /** Visible page heading (H1). */
  heading: string;
  /** Visible introduction shown under the heading. */
  intro: string;
  breadcrumbs: SeoLink[];
  /** Section title and links rendered in the static HTML body. */
  linksHeading: string;
  links: SeoLink[];
  /** Tool content sections (tool overrides only). */
  sections: ContentSection[];
  jsonLd: Record<string, unknown> | null;
}

export interface SeoSite {
  language: string;
  pages: SeoPage[];
  notFound: SeoPage;
}

export interface HeadTag {
  tag: 'title' | 'meta' | 'link' | 'script';
  attrs: Record<string, string>;
  text?: string;
}
