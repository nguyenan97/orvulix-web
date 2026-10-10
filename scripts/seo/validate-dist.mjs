#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { NOT_FOUND_FILE, htmlFileForPath, loadSeoSite } from './prerender.mjs';

/**
 * Validates the generated dist/ output: route coverage, 404 handling and
 * Netlify routing. Prints every problem and exits non-zero on failure.
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
  const { site } = await loadSeoSite();
  const expected = new Map(
    site.pages.map((page) => [htmlFileForPath(page.path), page])
  );

  for (const [file, page] of expected) {
    const html = await readOrNull(file);
    const at = `${relative(process.cwd(), file)} (route ${page.path})`;
    if (html === null) {
      problems.push(`Missing ${at}.`);
      continue;
    }
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
    if (!/<meta name="robots" content="noindex[^"]*"/.test(notFound)) {
      problems.push('dist/404.html must have a robots noindex meta tag.');
    }
    if (/rel="canonical"/.test(notFound)) {
      problems.push('dist/404.html must not have a canonical link.');
    }
  }

  for (const file of await listHtml(DIST)) {
    if (file !== NOT_FOUND_FILE && !expected.has(file)) {
      problems.push(`Unexpected HTML file ${relative(process.cwd(), file)}.`);
    }
  }

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
  resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)
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
