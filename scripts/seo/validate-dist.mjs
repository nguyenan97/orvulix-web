#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOT_FOUND_FILE, htmlFileForPath, loadSeoSite } from './prerender.mjs';
import { validateCacheHeaders } from './validate-headers.mjs';
import { validateRouteHtml } from './validate-html.mjs';

/**
 * Validates the generated dist/ output: route coverage, 404 handling,
 * Netlify routing and cache headers, and the font preload. Prints every
 * problem and exits non-zero on failure.
 */

const DIST = resolve('dist');

async function listHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listHtml(path)));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const readOrNull = async (path) => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
};

const count = (html, pattern) => (html.match(pattern) ?? []).length;

/** Width and height from a PNG file's IHDR chunk, or null if not a PNG. */
export function pngSize(buffer) {
  const signature = '89504e470d0a1a0a';
  if (
    buffer.length < 24 ||
    buffer.subarray(0, 8).toString('hex') !== signature
  ) {
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function validateSocialImage(core) {
  const { image, origin } = core.SITE;
  const file = join(DIST, ...image.path.slice(1).split('/'));
  let buffer;
  try {
    buffer = await readFile(file);
  } catch {
    return [`Social image ${image.path} is missing from dist/.`];
  }
  const size = pngSize(buffer);
  if (image.type !== 'image/png' || !size) {
    return [`Social image ${image.path} must be a PNG declared as image/png.`];
  }
  if (size.width !== image.width || size.height !== image.height) {
    return [
      `Social image ${image.path} is ${size.width}x${size.height}, but metadata declares ${image.width}x${image.height}.`
    ];
  }
  if (!origin.startsWith('https://'))
    return ['Social image URL must use HTTPS.'];
  return [];
}

/**
 * The font preload must point to a file that exists and that the font
 * stylesheet uses for normal text, with the attributes browsers need to
 * reuse the preloaded response.
 */
export async function validateFontPreload(html, distDir = DIST) {
  const problems = [];
  const preloads = [
    ...html.matchAll(/<link\b[^>]*rel="preload"[^>]*as="font"[^>]*>/g)
  ].map((match) => match[0]);
  if (preloads.length !== 1)
    return [`Expected one font preload, found ${preloads.length}.`];
  const tag = preloads[0];
  const href = /href="([^"]+)"/.exec(tag)?.[1] ?? '';
  if (!/\bcrossorigin\b/.test(tag))
    problems.push('Font preload needs crossorigin.');
  if (!/type="font\/(ttf|woff2?|otf)"/.test(tag))
    problems.push('Font preload needs a font type.');
  if ((await readOrNull(join(distDir, href))) === null) {
    problems.push(`Preloaded font ${href} does not exist in dist/.`);
  }
  const stylesheets = [
    ...html.matchAll(
      /<link\b[^>]*href="([^"]+\.css)"[^>]*rel="stylesheet"[^>]*>/g
    )
  ];
  let used = false;
  for (const [, cssHref] of stylesheets) {
    const css = await readOrNull(join(distDir, cssHref));
    if (!css) continue;
    for (const face of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
      const url = /url\("?([^")]+)"?\)/.exec(face)?.[1];
      if (!url || /font-style:\s*italic/.test(face)) continue;
      const resolved = new URL(url, `https://x${cssHref}`).pathname;
      if (resolved === href) used = true;
    }
  }
  if (!used)
    problems.push(
      `Preloaded font ${href} is not used by a normal-style @font-face.`
    );
  return problems;
}

/** Catch-all rewrites would turn unknown paths into soft 404s. */
export function findCatchAllRewrites(redirectsFile, netlifyToml) {
  const problems = [];
  for (const line of (redirectsFile ?? '').split('\n')) {
    const rule = line.trim();
    if (!rule || rule.startsWith('#')) continue;
    const [from, , status] = rule.split(/\s+/);
    if (from === '/*' && (!status || status.startsWith('200'))) {
      problems.push(`_redirects contains a catch-all rewrite: "${rule}".`);
    }
  }
  const tomlRules = (netlifyToml ?? '').split('[[redirects]]').slice(1);
  for (const rule of tomlRules) {
    const from = /from\s*=\s*"([^"]*)"/.exec(rule)?.[1];
    const status = /status\s*=\s*(\d+)/.exec(rule)?.[1] ?? '301';
    if (from === '/*' && status === '200') {
      problems.push('netlify.toml contains a catch-all [[redirects]] rewrite.');
    }
  }
  return problems;
}

export async function validateDist() {
  const problems = [];
  const { core, site } = await loadSeoSite();
  problems.push(...(await validateSocialImage(core)));
  const expected = new Map(
    site.pages.map((page) => [htmlFileForPath(page.path), page])
  );

  const seenTitles = new Map();
  const seenDescriptions = new Map();
  for (const [file, page] of expected) {
    const html = await readOrNull(file);
    const at = `${relative(process.cwd(), file)} (route ${page.path})`;
    if (html === null) {
      problems.push(`Missing ${at}.`);
      continue;
    }
    problems.push(...validateRouteHtml(html, page, core.SITE, at));
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
    const description = /<meta name="description" content="([^"]*)"/.exec(
      html
    )?.[1];
    if (seenTitles.has(title))
      problems.push(`${at}: title duplicates ${seenTitles.get(title)}.`);
    if (seenDescriptions.has(description)) {
      problems.push(
        `${at}: description duplicates ${seenDescriptions.get(description)}.`
      );
    }
    seenTitles.set(title, page.path);
    seenDescriptions.set(description, page.path);
    if (count(html, /<title>/g) !== 1)
      problems.push(`${at}: expected one <title>.`);
    if (count(html, /rel="canonical"/g) !== 1) {
      problems.push(`${at}: expected exactly one canonical link.`);
    } else if (
      !html.includes(`<link rel="canonical" href="${page.canonical}"`)
    ) {
      problems.push(`${at}: canonical must be ${page.canonical}.`);
    }
    if (/noindex/.test(html))
      problems.push(`${at}: indexable route contains noindex.`);
    if (page.path !== '/') {
      const directoryIndex = join(file.slice(0, -'.html'.length), 'index.html');
      if ((await readOrNull(directoryIndex)) !== null) {
        problems.push(
          `${relative(
            process.cwd(),
            directoryIndex
          )} must not exist next to ${at}.`
        );
      }
    }
  }

  const notFound = await readOrNull(NOT_FOUND_FILE);
  if (notFound === null) problems.push('Missing dist/404.html.');
  else {
    problems.push(
      ...validateRouteHtml(notFound, site.notFound, core.SITE, 'dist/404.html')
    );
    if (!/<meta name="robots" content="noindex[^"]*"/.test(notFound)) {
      problems.push('dist/404.html must have a robots noindex meta tag.');
    }
    if (/rel="canonical"/.test(notFound)) {
      problems.push('dist/404.html must not have a canonical link.');
    }
  }

  for (const file of await listHtml(DIST)) {
    // HTML copied unchanged from public/ (e.g. a Search Console verification
    // file) is not a route.
    const fromPublic =
      (await readOrNull(join('public', relative(DIST, file)))) !== null;
    if (file !== NOT_FOUND_FILE && !fromPublic && !expected.has(file)) {
      problems.push(`Unexpected HTML file ${relative(process.cwd(), file)}.`);
    }
  }

  const netlifyToml = (await readOrNull('netlify.toml')) ?? '';
  problems.push(...(await validateCacheHeaders(netlifyToml)));
  problems.push(
    ...(await validateFontPreload(
      (await readOrNull(join(DIST, 'index.html'))) ?? ''
    ))
  );

  problems.push(
    ...findCatchAllRewrites(
      await readOrNull(join(DIST, '_redirects')),
      await readOrNull('netlify.toml')
    )
  );
  return { problems, site };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { problems, site } = await validateDist();
  if (problems.length) {
    console.error(
      `\n[seo] dist validation failed:\n  - ${problems.join('\n  - ')}\n`
    );
    process.exit(1);
  }
  console.log(
    `[seo] dist validation passed: ${site.pages.length} route files and 404.html.`
  );
}
