import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseUrl = 'https://orvulix.io.vn';
const pages = new Set(['/', '/about', '/roadmap', '/contact', '/privacy', '/terms']);
const categories = new Set();

async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
    } else if (/^meta\.[jt]sx?$/.test(entry.name)) {
      const source = await readFile(path, 'utf8');
      const category = source.match(/defineTool\(\s*['\"]([^'\"]+)['\"]/);
      const slug = source.match(/\bpath:\s*['\"]([^'\"]+)['\"]/);
      if (category && slug) {
        categories.add(category[1]);
        pages.add('/' + category[1] + '/' + slug[1]);
      }
    }
  }
}

await scan('src/pages/tools');
for (const category of categories) pages.add('/categories/' + category);
const escapeXml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  [...pages].sort().map((path) => '  <url><loc>' + escapeXml(baseUrl + path) + '</loc></url>').join('\n') +
  '\n</urlset>\n';
await writeFile('public/sitemap.xml', xml);
console.log('Generated sitemap with', pages.size, 'URLs');
