import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { loadSeoSite } from './seo/prerender.mjs';

const origin = 'https://orvulix.io.vn';
const dist = 'dist';

// Expected URLs: every indexable route of the shared SEO model.
const { site, tools } = await loadSeoSite();
const indexable = site.pages.filter((page) => page.indexable);
const expected = new Set(indexable.map((page) => page.path));
const categories = new Set(tools.map((tool) => tool.category));

// Route HTML files actually written to dist/. 404.html and HTML files copied
// unchanged from public/ (e.g. a Search Console verification file) are not routes.
const fromPublic = (file) =>
  stat(join('public', file)).then(() => true, () => false);
async function htmlRoutes(directory) {
  const routes = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) routes.push(...(await htmlRoutes(path)));
    else if (entry.name.endsWith('.html')) {
      const file = relative(dist, path);
      if (file === '404.html' || (await fromPublic(file))) continue;
      routes.push(file === 'index.html' ? '/' : `/${file.slice(0, -'.html'.length)}`);
    }
  }
  return routes;
}
const generated = new Set(await htmlRoutes(dist));

const xml = await readFile(join(dist, 'sitemap.xml'), 'utf8');
if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) throw new Error('Invalid sitemap XML declaration');
if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) throw new Error('Invalid sitemap namespace');
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (locations.length === 0) throw new Error('Sitemap is empty');
if (locations.length !== (xml.match(/<url>/g) || []).length) throw new Error('Mismatched URL entries');
const actual = new Set();
for (const url of locations) {
  const parsed = new URL(url);
  if (parsed.origin !== origin || parsed.search || parsed.hash) throw new Error(`Invalid sitemap URL: ${url}`);
  if (actual.has(parsed.pathname)) throw new Error(`Duplicate sitemap URL: ${url}`);
  actual.add(parsed.pathname);
}
const page = (path) => site.pages.find((item) => item.path === path);
for (const path of actual) {
  if (page(path)?.canonical !== `${origin}${path === '/' ? '/' : path}`) {
    throw new Error(`Sitemap URL does not match the page canonical: ${path}`);
  }
}
const compare = (label, left, right) => {
  const missing = [...left].filter((path) => !right.has(path));
  const unexpected = [...right].filter((path) => !left.has(path));
  if (missing.length || unexpected.length) {
    throw new Error(`${label} mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}`);
  }
};
compare('Sitemap', expected, actual);
compare('Sitemap vs generated HTML', generated, actual);
if (actual.has('/404')) throw new Error('The 404 page must not be in the sitemap');

const now = Date.now();
let withLastmod = 0;
for (const entry of entries) {
  const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(entry)?.[1];
  if (!lastmod) continue;
  withLastmod++;
  const time = Date.parse(lastmod);
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z))?$/.test(lastmod) || Number.isNaN(time)) {
    throw new Error(`Invalid lastmod "${lastmod}" in ${entry.trim()}`);
  }
  if (time > now + 24 * 60 * 60 * 1000) throw new Error(`lastmod in the future: ${entry.trim()}`);
}
console.log(`Sitemap validation passed: ${locations.length} URLs (${withLastmod} with lastmod), ${tools.length} tool routes, ${categories.size} categories.`);
