import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
  stat
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

const htmlFiles = async (dir, prefix = '') => {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(prefix, entry.name);
    if (entry.isDirectory())
      files.push(...(await htmlFiles(join(dir, entry.name), path)));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
};

export function developmentHtml(html, base) {
  return html
    .replace(/<meta\b[^>]*name="robots"[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(
      /<meta\b[^>]*(?:property="og:url"|property="og:image"|name="twitter:image")[^>]*>/gi,
      ''
    )
    .replace(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
      ''
    )
    .replace(/\b(href|src)="\/(?!\/)([^"]*)"/g, (match, attr, path) => {
      if (path.startsWith(base.slice(1))) return match;
      return `${attr}="${base}${path}"`;
    })
    .replace(
      '</head>',
      '<meta name="robots" content="noindex, follow">\n</head>'
    );
}

export async function preparePages(source, output, base) {
  // Only the explicitly designated artifact directory is replaced.
  await rm(output, { recursive: true, force: true });
  await cp(source, output, { recursive: true });
  const files = await htmlFiles(output);
  for (const file of files) {
    const path = join(output, file);
    const html = developmentHtml(await readFile(path, 'utf8'), base);
    const target =
      file === 'index.html' || file === '404.html'
        ? path
        : join(output, file.slice(0, -5), 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html);
    if (target !== path) await rm(path);
  }
  for (const file of ['sitemap.xml', '_redirects', '_headers', 'CNAME']) {
    await rm(join(output, file), { force: true });
  }
  // Do not Disallow crawling: crawlers need to read the HTML noindex directive.
  await writeFile(join(output, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  await writeFile(join(output, '.nojekyll'), '');
  const manifestPath = join(output, 'site.webmanifest');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.name = 'Orvulix Dev';
  manifest.start_url = base;
  manifest.scope = base;
  for (const icon of manifest.icons ?? []) {
    if (icon.src.startsWith('/')) icon.src = base + icon.src.slice(1);
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const generated = await htmlFiles(output);
  for (const file of generated) {
    const html = await readFile(join(output, file), 'utf8');
    if (
      !html.includes('content="noindex, follow"') ||
      /rel="canonical"|property="og:url"|application\/ld\+json/.test(html)
    ) {
      throw new Error(`Unsafe dev metadata in ${file}`);
    }
    for (const [, attr, url] of html.matchAll(
      /\b(href|src)="(\/[^\/"][^"]*)"/g
    )) {
      if (!url.startsWith(base))
        throw new Error(`Unprefixed ${attr} in ${file}: ${url}`);
      const local = decodeURI(url.slice(base.length).split(/[?#]/)[0]);
      if (!local || url.includes('&')) continue;
      const target = join(output, local);
      let exists;
      try {
        exists = await stat(target);
      } catch {
        /* checked below */
      }
      if (!exists)
        throw new Error(`Missing local ${attr} target in ${file}: ${url}`);
    }
  }
  console.log(
    `[pages] Validated ${generated.length} dev HTML files under ${base}. Output: ${output}`
  );
}
