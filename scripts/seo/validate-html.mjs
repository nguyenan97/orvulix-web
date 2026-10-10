/**
 * Independent checks of one generated HTML document. The HTML is parsed with
 * simple patterns (the generator's own output format) and compared with the
 * expected page model, so a rendering bug cannot validate itself.
 */

const decode = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const attributes = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map(([, name, value]) => [
      name,
      decode(value)
    ])
  );

const head = (html) => /<head>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? '';

export const SOCIAL_TAGS = [
  ['property', 'og:type'],
  ['property', 'og:site_name'],
  ['property', 'og:title'],
  ['property', 'og:description'],
  ['property', 'og:url'],
  ['property', 'og:image'],
  ['property', 'og:image:width'],
  ['property', 'og:image:height'],
  ['property', 'og:image:type'],
  ['property', 'og:image:alt'],
  ['name', 'twitter:card'],
  ['name', 'twitter:title'],
  ['name', 'twitter:description'],
  ['name', 'twitter:image'],
  ['name', 'twitter:image:alt']
];

const FORBIDDEN_SCHEMA =
  /"(SearchAction|aggregateRating|review|offers|potentialAction)"/;
const PLACEHOLDER = /\bundefined\b|\bNaN\b|\[object Object\]|\{\{|\$t\(/;

function collectUrls(value, out = []) {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) out.push(value);
  else if (Array.isArray(value))
    value.forEach((item) => collectUrls(item, out));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectUrls(item, out));
  }
  return out;
}

function checkJsonLd(text, page, site, problems, at) {
  if (/</.test(text))
    problems.push(`${at}: JSON-LD contains an unescaped "<".`);
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    problems.push(`${at}: JSON-LD is not valid JSON (${error.message}).`);
    return;
  }
  if (
    data['@context'] !== 'https://schema.org' ||
    !Array.isArray(data['@graph'])
  ) {
    problems.push(
      `${at}: JSON-LD must have @context https://schema.org and an @graph array.`
    );
    return;
  }
  if (FORBIDDEN_SCHEMA.test(text)) {
    problems.push(
      `${at}: JSON-LD contains search actions, ratings, reviews or offers.`
    );
  }
  for (const url of collectUrls(data['@graph'])) {
    if (!url.startsWith(`${site.origin}/`) && url !== site.repositoryUrl) {
      problems.push(`${at}: JSON-LD references an unexpected URL ${url}.`);
    }
  }
  const nodes = data['@graph'];
  const ofType = (type) => nodes.filter((node) => node['@type'] === type);
  if (nodes.some((node) => typeof node['@type'] !== 'string')) {
    problems.push(`${at}: every JSON-LD node needs an @type.`);
  }
  const crumbs = ofType('BreadcrumbList')[0]?.itemListElement;
  if (page.kind !== 'home') {
    if (!crumbs?.length || crumbs[crumbs.length - 1].item !== page.canonical) {
      problems.push(`${at}: BreadcrumbList must end with the page URL.`);
    } else if (crumbs.some((crumb, index) => crumb.position !== index + 1)) {
      problems.push(
        `${at}: BreadcrumbList positions must start at 1 and be consecutive.`
      );
    }
  }
  if (page.kind === 'tool') {
    const app = ofType('WebApplication')[0];
    if (!app || app.url !== page.canonical || app.name !== page.heading) {
      problems.push(
        `${at}: WebApplication must describe this tool (name and url).`
      );
    }
  } else if (page.kind === 'category') {
    const collection = ofType('CollectionPage')[0];
    const list = collection?.mainEntity;
    if (!collection || collection.url !== page.canonical) {
      problems.push(`${at}: CollectionPage must use the page URL.`);
    } else if (
      !list?.itemListElement?.length ||
      list.numberOfItems !== list.itemListElement.length
    ) {
      problems.push(`${at}: CollectionPage ItemList is empty or miscounted.`);
    }
  } else if (page.kind === 'home') {
    if (!ofType('WebSite').length || !ofType('Organization').length) {
      problems.push(
        `${at}: home JSON-LD must contain WebSite and Organization.`
      );
    }
  } else if (page.kind === 'info') {
    if (!nodes.some((node) => node.url === page.canonical)) {
      problems.push(`${at}: info page JSON-LD must describe the page URL.`);
    }
  }
}

/** Returns problems for one route HTML document. */
export function validateRouteHtml(html, page, site, at) {
  const problems = [];
  const headHtml = head(html);
  const metas = [...headHtml.matchAll(/<meta\b[^>]*>/gi)].map((tag) =>
    attributes(tag[0])
  );
  const find = (key, value) => metas.filter((meta) => meta[key] === value);
  const single = (key, value) => {
    const found = find(key, value);
    if (found.length !== 1)
      problems.push(`${at}: expected one ${value} tag, found ${found.length}.`);
    return found[0]?.content;
  };

  const lang = /<html lang="([^"]*)"/.exec(html)?.[1];
  if (lang !== page.language)
    problems.push(`${at}: html lang must be "${page.language}".`);
  const titles = [...headHtml.matchAll(/<title>([^<]*)<\/title>/g)].map(
    (match) => decode(match[1])
  );
  if (titles.length !== 1 || titles[0] !== page.title) {
    problems.push(`${at}: <title> must be exactly "${page.title}".`);
  }
  if (single('name', 'description') !== page.description) {
    problems.push(`${at}: meta description does not match the page.`);
  }
  const robots = single('name', 'robots') ?? '';
  const canonicals = [
    ...headHtml.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)
  ].map((tag) => attributes(tag[0]).href);
  const scripts = [
    ...headHtml.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    )
  ].map((match) => match[1]);

  if (page.indexable) {
    if (/noindex/.test(robots))
      problems.push(`${at}: indexable page is noindex.`);
    if (canonicals.length !== 1 || canonicals[0] !== page.canonical) {
      problems.push(`${at}: expected one canonical ${page.canonical}.`);
    }
    if (!page.canonical.startsWith(`${site.origin}/`)) {
      problems.push(`${at}: canonical must be an absolute ${site.origin} URL.`);
    }
    const values = Object.fromEntries(
      SOCIAL_TAGS.map(([key, value]) => [value, single(key, value)])
    );
    for (const [name, value] of Object.entries(values)) {
      if (!value) problems.push(`${at}: ${name} is empty.`);
    }
    if (values['og:url'] !== page.canonical)
      problems.push(`${at}: og:url must equal the canonical.`);
    if (
      values['og:title'] !== page.title ||
      values['twitter:title'] !== page.title
    ) {
      problems.push(`${at}: og:title and twitter:title must equal the title.`);
    }
    if (
      values['og:description'] !== page.description ||
      values['twitter:description'] !== page.description
    ) {
      problems.push(
        `${at}: og:description and twitter:description must equal the description.`
      );
    }
    const image = `${site.origin}${site.image.path}`;
    if (values['og:image'] !== image || values['twitter:image'] !== image) {
      problems.push(`${at}: og:image and twitter:image must be ${image}.`);
    }
    if (values['twitter:card'] !== 'summary_large_image') {
      problems.push(`${at}: twitter:card must be summary_large_image.`);
    }
    if (scripts.length !== 1)
      problems.push(
        `${at}: expected one JSON-LD script, found ${scripts.length}.`
      );
    else checkJsonLd(scripts[0], page, site, problems, at);
  } else {
    if (!/noindex/.test(robots)) problems.push(`${at}: page must be noindex.`);
    if (canonicals.length)
      problems.push(`${at}: noindex page must not have a canonical.`);
    if (
      metas.some((meta) =>
        /^(og|twitter):/.test(meta.property ?? meta.name ?? '')
      )
    ) {
      problems.push(`${at}: noindex page must not have social tags.`);
    }
    if (scripts.length)
      problems.push(`${at}: noindex page must not have JSON-LD.`);
  }

  const body = /<body>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? '';
  const noscripts = [...body.matchAll(/<noscript>([\s\S]*?)<\/noscript>/g)].map(
    (match) => match[1]
  );
  if (noscripts.length !== 1)
    problems.push(`${at}: expected one <noscript> block.`);
  const h1s = [...(noscripts[0] ?? '').matchAll(/<h1>([^<]*)<\/h1>/g)].map(
    (match) => decode(match[1])
  );
  if (h1s.length !== 1 || h1s[0] !== page.heading) {
    problems.push(`${at}: <noscript> must contain one <h1> "${page.heading}".`);
  }
  const root =
    /<div id="root">([\s\S]*?)<\/div>\s*(?:<script\b[\s\S]*)?$/.exec(
      body
    )?.[1] ?? '';
  if (!root.includes('data-seo-static'))
    problems.push(`${at}: #root has no static content.`);
  if (/<h1\b/.test(root))
    problems.push(`${at}: static #root content must not contain an <h1>.`);
  if ((body.match(/data-seo-static[\s>]/g) ?? []).length !== 2) {
    problems.push(
      `${at}: static content must appear exactly once in <noscript> and once in #root.`
    );
  }
  for (const section of page.sections) {
    if (!root.includes(`<h2>${section.heading.replace(/&/g, '&amp;')}`)) {
      problems.push(
        `${at}: static content is missing the section "${section.heading}".`
      );
    }
  }
  const visibleText = decode(
    `${headHtml}\n${body}`.replace(/<script\b[\s\S]*?<\/script>/g, '')
  );
  if (PLACEHOLDER.test(visibleText))
    problems.push(`${at}: placeholder-like text in the document.`);
  return problems;
}
