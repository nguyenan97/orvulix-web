import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const origin = 'https://orvulix.io.vn';
const staticPaths = ['/', '/about', '/roadmap', '/contact', '/privacy', '/terms'];
const expected = new Set(staticPaths);
const categories = new Set();
let toolCount = 0;

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(filename);
    } else if (/^meta\.[jt]sx?$/.test(entry.name)) {
      const source = await readFile(filename, 'utf8');
      const category = source.match(/defineTool\(\s*['"]([^'"]+)['"]/);
      const slug = source.match(/\bpath:\s*['"]([^'"]+)['"]/);
      if (!category || !slug) throw new Error(`Unrecognized tool metadata: ${filename}`);
      const path = `/${category[1]}/${slug[1]}`;
      if (expected.has(path)) throw new Error(`Duplicate tool route: ${path}`);
      expected.add(path);
      categories.add(category[1]);
      toolCount++;
    }
  }
}
await scan('src/pages/tools');
for (const category of categories) expected.add(`/categories/${category}`);

const xml = await readFile('public/sitemap.xml', 'utf8');
if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) throw new Error('Invalid sitemap XML declaration');
if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) throw new Error('Invalid sitemap namespace');
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
const missing = [...expected].filter(path => !actual.has(path));
const unexpected = [...actual].filter(path => !expected.has(path));
if (missing.length || unexpected.length) throw new Error(`Sitemap mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}`);
console.log(`Sitemap validation passed: ${locations.length} URLs, ${toolCount} tool routes, ${categories.size} categories.`);
