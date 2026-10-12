import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

/**
 * Guards for netlify.toml cache headers: a long-lived immutable
 * Cache-Control may only apply to content-hashed files emitted by Vite.
 * Files copied from public/ keep their names between deploys and must never
 * match such a rule, and HTML must never be cached as immutable.
 */

/** Vite output names: `<name>-<8 character hash>.<ext>`. */
const HASHED = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;

/** Parses [[headers]] blocks with `for` and Cache-Control from netlify.toml. */
export function cacheRules(toml) {
  return toml
    .split('[[headers]]')
    .slice(1)
    .map((block) => ({
      pattern: /for\s*=\s*"([^"]+)"/.exec(block)?.[1],
      cacheControl: /Cache-Control\s*=\s*"([^"]+)"/i.exec(block)?.[1]
    }))
    .filter((rule) => rule.pattern && rule.cacheControl);
}

/** Netlify header paths: `*` matches any characters, including `/`. */
export const patternToRegExp = (pattern) =>
  new RegExp(
    `^${pattern
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}/?$`,
    'i'
  );

async function listFiles(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path, base)));
    else files.push(`/${relative(base, path).split('\\').join('/')}`);
  }
  return files;
}

export async function validateCacheHeaders(
  toml,
  { publicDir = 'public', distDir = 'dist' } = {}
) {
  const problems = [];
  const rules = cacheRules(toml);
  const immutable = rules.filter((rule) =>
    /immutable/i.test(rule.cacheControl)
  );
  const publicFiles = await listFiles(publicDir);
  const distFiles = await listFiles(distDir);
  for (const rule of immutable) {
    const matcher = patternToRegExp(rule.pattern);
    for (const file of publicFiles.filter((path) => matcher.test(path))) {
      problems.push(
        `Immutable rule "${rule.pattern}" matches unhashed public file ${file}.`
      );
    }
    for (const file of distFiles.filter((path) => matcher.test(path))) {
      if (!HASHED.test(file)) {
        problems.push(
          `Immutable rule "${rule.pattern}" matches ${file}, which has no content hash.`
        );
      }
      if (/\.html?$/.test(file) || file.endsWith('.xml')) {
        problems.push(
          `Immutable rule "${rule.pattern}" matches document ${file}.`
        );
      }
    }
    for (const route of [
      '/',
      '/string/uppercase',
      '/sitemap.xml',
      '/robots.txt'
    ]) {
      if (matcher.test(route)) {
        problems.push(`Immutable rule "${rule.pattern}" matches ${route}.`);
      }
    }
  }
  const overlapping = rules.filter((rule) =>
    rules.some(
      (other) =>
        other !== rule &&
        distFiles.some(
          (file) =>
            patternToRegExp(rule.pattern).test(file) &&
            patternToRegExp(other.pattern).test(file)
        )
    )
  );
  if (overlapping.length) {
    problems.push(
      `Cache-Control rules overlap (${overlapping
        .map((rule) => rule.pattern)
        .join(', ')}); Netlify does not define which one wins.`
    );
  }
  return problems;
}
