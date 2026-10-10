import { SITE } from './config';
import { getHeadTags, renderHeadTags } from './head';
import { escapeHtml } from './text';
import type { ContentSection, SeoPage } from './types';

/**
 * Build-time HTML for a route. The template is Vite's dist/index.html; the
 * React root, scripts and stylesheets are kept untouched. Static body content
 * lives inside #root and is replaced by React on its first render, while the
 * <noscript> block carries the H1 and description for clients without
 * JavaScript. Both contain only content that the React page also renders.
 */

const STATIC_STYLE = `<style data-seo-static-style>[data-seo-static]{box-sizing:border-box;max-width:960px;margin:0 auto;padding:24px 16px;font-family:Quicksand,sans-serif;line-height:1.6}[data-seo-static] h1{font-size:2rem;font-weight:700;margin:0 0 .5rem}[data-seo-static] h2{font-size:1.4rem;font-weight:700;margin:1.5rem 0 .5rem}[data-seo-static] h3{font-size:1.1rem;font-weight:700;margin:1rem 0 .25rem}[data-seo-static] ol,[data-seo-static] ul{padding-left:1.5rem;margin:.5rem 0}[data-seo-static] ol{list-style:decimal}[data-seo-static] ul{list-style:disc}[data-seo-static] nav ol{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.5rem}[data-seo-static] a{color:#0F766E}</style>`;

const link = (path: string, name: string) =>
  `<a href="${escapeHtml(path)}">${escapeHtml(name)}</a>`;

const renderSection = (section: ContentSection): string => {
  const heading = `<h2>${escapeHtml(section.heading)}</h2>`;
  switch (section.kind) {
    case 'steps':
      return `<section>${heading}<ol>${(section.steps ?? [])
        .map((step) => `<li>${escapeHtml(step)}</li>`)
        .join('')}</ol></section>`;
    case 'list':
      return `<section>${heading}<ul>${(section.items ?? [])
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul></section>`;
    case 'examples':
      return `<section>${heading}${(section.examples ?? [])
        .map(
          (example) =>
            `<h3>${escapeHtml(example.title)}</h3><p>${escapeHtml(
              example.description
            )}</p>`
        )
        .join('')}</section>`;
    case 'faq':
      return `<section>${heading}${(section.faq ?? [])
        .map(
          (item) =>
            `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(
              item.answer
            )}</p>`
        )
        .join('')}</section>`;
  }
};

/** Heading and introduction for clients without JavaScript. */
export const renderNoscript = (page: SeoPage): string =>
  `<noscript><div data-seo-static><h1>${escapeHtml(
    page.heading
  )}</h1><p>${escapeHtml(
    page.intro
  )}</p><p>JavaScript is required to use the interactive tools on ${escapeHtml(
    SITE.name
  )}.</p></div></noscript>`;

/** Content placed inside #root until React renders. Contains no H1. */
export const renderStaticRoot = (page: SeoPage): string => {
  const parts: string[] = [];
  if (page.breadcrumbs.length > 1) {
    const items = page.breadcrumbs.map((crumb, index) =>
      index === page.breadcrumbs.length - 1
        ? `<li aria-current="page">${escapeHtml(crumb.name)}</li>`
        : `<li>${link(crumb.path, crumb.name)}</li>`
    );
    parts.push(`<nav aria-label="Breadcrumb"><ol>${items.join('')}</ol></nav>`);
  }
  parts.push(...page.sections.map(renderSection));
  if (page.links.length) {
    const heading = page.linksHeading
      ? `<h2>${escapeHtml(page.linksHeading)}</h2>`
      : '';
    const items = page.links.map(
      (item) =>
        `<li>${link(item.path, item.name)}${
          item.description ? ` - ${escapeHtml(item.description)}` : ''
        }</li>`
    );
    parts.push(`<section>${heading}<ul>${items.join('')}</ul></section>`);
  }
  return `<div data-seo-static>${parts.join('')}</div>`;
};

const MANAGED_TEMPLATE_PATTERNS: RegExp[] = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\b[^>]*\b(?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/gi,
  /<link\b[^>]*\brel="canonical"[^>]*>\s*/gi,
  /<script\b[^>]*\btype="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi
];

const ROOT_ELEMENT = '<div id="root"></div>';

/**
 * Renders the full HTML document for a page from the Vite template. Throws
 * when the template does not have the expected structure.
 */
export const renderDocument = (template: string, page: SeoPage): string => {
  if (template.split(ROOT_ELEMENT).length !== 2) {
    throw new Error(`Template must contain exactly one ${ROOT_ELEMENT}.`);
  }
  if (!/<html\b[^>]*>/i.test(template) || !/<\/head>/i.test(template)) {
    throw new Error('Template must contain <html> and </head>.');
  }
  let html = template;
  for (const pattern of MANAGED_TEMPLATE_PATTERNS)
    html = html.replace(pattern, '');
  html = html.replace(
    /<html\b[^>]*>/i,
    `<html lang="${escapeHtml(page.language)}">`
  );
  html = html.replace(
    /<\/head>/i,
    `  ${renderHeadTags(getHeadTags(page))}\n  ${STATIC_STYLE}\n</head>`
  );
  html = html.replace(
    ROOT_ELEMENT,
    `${renderNoscript(page)}\n<div id="root">${renderStaticRoot(page)}</div>`
  );
  return html;
};
