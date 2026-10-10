// Generates dist/sitemap.xml from the shared SEO route model (scripts/seo).
// Run after `vite build` and scripts/seo/prerender.mjs (see npm run build).
import { writeSitemap } from './seo/sitemap.mjs';

const { entries, withDate } = await writeSitemap();
console.log(
  `Generated dist/sitemap.xml with ${entries.length} URLs (${withDate} with lastmod)`
);
