import { stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { LOCALES_DIR } from './discover.mjs';
import { createGitDates, latestDate } from './lastmod.mjs';
import { loadSeoSite } from './prerender.mjs';

/**
 * Sitemap for every indexable route of the SEO model (the same set the
 * prerender step writes as HTML). <lastmod> comes from Git history of each
 * page's content sources and is omitted when it cannot be verified.
 */

const DIST = resolve('dist');
export const SITEMAP_FILE = join(DIST, 'sitemap.xml');
export const TOOL_CONTENT_DIR = 'src/seo/tool-content';

const localeFile = (namespace) => `${LOCALES_DIR}/${namespace}.json`;

/** Splits `ns:a.b.c` into its locale file and key path. */
const keyLocation = (key) => {
  const [namespace, path] = key.split(':');
  return { file: localeFile(namespace), path: path.split('.') };
};

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/** Content sources per route path: files and JSON key paths. */
export async function pageSources(site, tools) {
  const sources = new Map();
  const toolByPath = new Map(tools.map((tool) => [`/${tool.path}`, tool]));
  for (const page of site.pages) {
    const files = [];
    const keys = [];
    if (page.kind === 'home') {
      files.push('src/pages/home', 'src/components/Hero.tsx');
      keys.push(
        { file: localeFile('translation'), path: ['hero'] },
        { file: localeFile('translation'), path: ['categories'] }
      );
    } else if (page.kind === 'info') {
      // All info pages share src/pages/information/index.tsx, so a change to
      // one page cannot be told apart from a change to another: no lastmod.
      sources.set(page.path, { untracked: true });
      continue;
    } else if (page.kind === 'category') {
      const category = page.path.split('/').pop();
      keys.push({
        file: localeFile('translation'),
        path: ['categories', category]
      });
      for (const tool of tools.filter((item) => item.category === category)) {
        keys.push(
          keyLocation(tool.nameKey),
          keyLocation(tool.shortDescriptionKey)
        );
      }
    } else if (page.kind === 'tool') {
      const tool = toolByPath.get(page.path);
      files.push(...tool.contentPaths);
      const contentFile = `${TOOL_CONTENT_DIR}/${tool.path}.ts`;
      if (await exists(contentFile)) files.push(contentFile);
      for (const key of [
        tool.nameKey,
        tool.descriptionKey,
        tool.shortDescriptionKey
      ]) {
        const location = keyLocation(key);
        // The whole tool subtree: every string the tool page shows.
        keys.push({ file: location.file, path: location.path.slice(0, -1) });
      }
    }
    sources.set(page.path, { files, keys });
  }
  return sources;
}

/** Resolves <lastmod> per indexable route; null when not verifiable. */
export async function resolveLastmod(site, tools) {
  const git = await createGitDates();
  const result = new Map();
  if (!git) {
    for (const page of site.pages) result.set(page.path, null);
    return { dates: result, shallow: false, git: false };
  }
  for (const [path, { files, keys, untracked }] of await pageSources(
    site,
    tools
  )) {
    if (untracked) {
      result.set(path, null);
      continue;
    }
    const byFile = new Map();
    for (const key of keys) {
      if (!byFile.has(key.file)) byFile.set(key.file, []);
      byFile.get(key.file).push(key.path);
    }
    const dates = [];
    if (files.length) dates.push(await git.pathDate(files));
    for (const [file, keyPaths] of byFile)
      dates.push(await git.jsonKeyDate(file, keyPaths));
    result.set(path, latestDate(dates));
  }
  return { dates: result, shallow: git.shallow, git: true };
}

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export function renderSitemap(entries) {
  const urls = entries.map(({ loc, lastmod }) =>
    lastmod
      ? `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></url>`
      : `  <url><loc>${escapeXml(loc)}</loc></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
    '\n'
  )}\n</urlset>\n`;
}

export async function writeSitemap() {
  const { site, tools } = await loadSeoSite();
  const { dates, shallow, git } = await resolveLastmod(site, tools);
  const entries = site.pages
    .filter((page) => page.indexable)
    .map((page) => ({ loc: page.canonical, lastmod: dates.get(page.path) }));
  await writeFile(SITEMAP_FILE, renderSitemap(entries));
  const withDate = entries.filter((entry) => entry.lastmod).length;
  const untracked = site.pages.filter((page) => page.kind === 'info').length;
  if (withDate < entries.length - untracked) {
    const reason = !git
      ? 'Git history is not available'
      : shallow
        ? 'the clone is shallow or some sources have uncommitted changes'
        : 'some sources have uncommitted changes or unreadable history';
    console.warn(
      `[seo] lastmod omitted for ${entries.length - untracked - withDate} of ${
        entries.length
      } URLs because ${reason}.`
    );
  }
  console.log(
    `[seo] lastmod is not tracked for the ${untracked} info pages (they share one source file).`
  );
  if (await exists('public/sitemap.xml')) {
    console.warn(
      '[seo] public/sitemap.xml is no longer generated or used; the build writes dist/sitemap.xml. Remove the stale file.'
    );
  }
  return { entries, withDate };
}
