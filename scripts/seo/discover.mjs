import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * Discovers tool routes and English strings without executing tool source.
 * Tool metadata is read with regular expressions; any metadata file that does
 * not match a supported shape is reported instead of being skipped, so a new
 * upstream tool can never silently miss its SEO metadata.
 */

export const TOOLS_DIR = 'src/pages/tools';
export const LOCALES_DIR = 'public/locales/en';
export const ROUTES_FILE = 'src/config/routesConfig.tsx';

const META_FILE = /^meta\.[jt]sx?$/;
const CATEGORY = /^[a-z][a-z0-9-]*$/;
const SLUG = /^[A-Za-z0-9][A-Za-z0-9-]*(?:\/[A-Za-z0-9][A-Za-z0-9-]*)*$/;
const KEY = /^([a-z]+):([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)$/;
const I18N_FIELDS = ['name', 'description', 'shortDescription'];

export class DiscoveryError extends Error {
  constructor(problems) {
    super(`SEO discovery failed:\n  - ${problems.join('\n  - ')}`);
    this.problems = problems;
  }
}

async function findMetaFiles(directory) {
  const found = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await findMetaFiles(path)));
    else if (META_FILE.test(entry.name)) found.push(path);
  }
  return found.sort();
}

async function resolveModule(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx')
  ]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function readI18nBlock(source) {
  const blocks = [...source.matchAll(/\bi18n:\s*\{([^{}]*)\}/g)];
  if (blocks.length !== 1) return null;
  const keys = {};
  for (const field of I18N_FIELDS) {
    const match = blocks[0][1].match(new RegExp(`\\b${field}:\\s*'([^']+)'`));
    keys[field] = match?.[1];
  }
  return keys;
}

function literalPaths(source) {
  return [...source.matchAll(/\bpath:\s*'([^']*)'\s*(?=[,}\n])/g)].map(
    (match) => match[1]
  );
}

export async function loadEnglishLocales(root = process.cwd()) {
  const directory = join(root, LOCALES_DIR);
  const namespaces = {};
  for (const file of (await readdir(directory)).sort()) {
    if (!file.endsWith('.json')) continue;
    const path = join(directory, file);
    try {
      namespaces[file.slice(0, -5)] = JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
      throw new DiscoveryError([
        `Cannot parse ${relative(root, path)}: ${error.message}`
      ]);
    }
  }
  return namespaces;
}

/** Resolves `namespace:dotted.key` like i18next with default separators. */
export function createTranslate(namespaces) {
  return (key) => {
    const match = KEY.exec(key);
    if (!match) return undefined;
    let value = namespaces[match[1]];
    for (const part of match[2].split('.')) value = value?.[part];
    return typeof value === 'string' ? value : undefined;
  };
}

/**
 * Supported generator shape (number/generic-calc): the meta file spreads
 * entries of a default-exported array module and prefixes their path:
 *   import items from './data/index';
 *   items.forEach((x) => tools.push(defineTool('cat', { ...x, path: 'prefix/' + x.path })))
 */
async function readGeneratedTools(file, source, category, root) {
  const pathExpr = source.match(/\bpath:\s*'([^']*)'\s*\+\s*(\w+)\.path\b/);
  if (!pathExpr) return null;
  const [, prefix, variable] = pathExpr;
  const loop = source.match(
    new RegExp(
      `(\\w+)\\.forEach\\(\\s*(?:\\(\\s*${variable}\\s*\\)|${variable})\\s*=>`
    )
  );
  if (!loop || !new RegExp(`\\.\\.\\.${variable}\\b`).test(source)) {
    throw new Error('generator does not spread its data entries');
  }
  const importMatch = source.match(
    new RegExp(`import\\s+${loop[1]}\\s+from\\s+'(\\.[^']+)'`)
  );
  const listFile = importMatch && (await resolveModule(file, importMatch[1]));
  if (!listFile) throw new Error(`cannot resolve data module for "${loop[1]}"`);
  const listSource = await readFile(listFile, 'utf8');
  const list = listSource.match(/export\s+default\s+\[([^\]]*)\]/);
  if (!list)
    throw new Error(`${relative(root, listFile)} has no default array export`);
  const tools = [];
  for (const identifier of list[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)) {
    const itemImport = listSource.match(
      new RegExp(`import\\s+${identifier}\\s+from\\s+'(\\.[^']+)'`)
    );
    const itemFile =
      itemImport && (await resolveModule(listFile, itemImport[1]));
    if (!itemFile)
      throw new Error(
        `cannot resolve "${identifier}" in ${relative(root, listFile)}`
      );
    const itemSource = await readFile(itemFile, 'utf8');
    const paths = literalPaths(itemSource);
    if (paths.length !== 1) {
      throw new Error(
        `${relative(root, itemFile)} must declare exactly one literal path`
      );
    }
    tools.push({
      category,
      path: `${category}/${prefix}${paths[0]}`,
      keys: readI18nBlock(itemSource),
      sources: [relative(root, itemFile)],
      contentPaths: [relative(root, listFile), relative(root, itemFile)]
    });
  }
  return tools;
}

/**
 * Discovers every tool route from tool metadata and validates its slug,
 * category and English locale keys. Throws DiscoveryError listing every
 * problem with the file, key or route involved.
 */
export async function discoverTools(root = process.cwd()) {
  const problems = [];
  const namespaces = await loadEnglishLocales(root);
  const translate = createTranslate(namespaces);
  const files = await findMetaFiles(join(root, TOOLS_DIR));
  if (files.length === 0)
    problems.push(`No tool metadata found in ${TOOLS_DIR}.`);
  const tools = [];

  for (const absolute of files) {
    const file = relative(root, absolute);
    let source;
    try {
      source = await readFile(absolute, 'utf8');
    } catch (error) {
      problems.push(`Cannot read ${file}: ${error.message}`);
      continue;
    }
    const definitions = [...source.matchAll(/defineTool\(\s*'([^']+)'\s*,/g)];
    if (definitions.length !== 1) {
      problems.push(
        `${file}: expected exactly one defineTool('<category>', ...) call.`
      );
      continue;
    }
    const category = definitions[0][1];
    let entries;
    try {
      entries = await readGeneratedTools(absolute, source, category, root);
    } catch (error) {
      problems.push(
        `${file}: unsupported generated tool metadata (${error.message}).`
      );
      continue;
    }
    if (!entries) {
      const paths = literalPaths(source);
      if (paths.length !== 1) {
        problems.push(
          `${file}: expected exactly one literal path: '<slug>' (found ${paths.length}). See docs/SEO.md.`
        );
        continue;
      }
      entries = [
        {
          category,
          path: `${category}/${paths[0]}`,
          keys: readI18nBlock(source),
          sources: [],
          contentPaths: [relative(root, dirname(absolute))]
        }
      ];
    }
    if (
      entries.some(
        (entry) =>
          !entry.contentPaths.includes(relative(root, dirname(absolute)))
      )
    ) {
      // Generated tools share the generator's own files (not other entries' data).
      const shared = (await readdir(dirname(absolute), { withFileTypes: true }))
        .filter((item) => item.isFile())
        .map((item) => relative(root, join(dirname(absolute), item.name)));
      for (const entry of entries) entry.contentPaths.unshift(...shared);
    }
    for (const entry of entries) {
      const route = `/${entry.path}`;
      if (!CATEGORY.test(category)) {
        problems.push(`${file}: invalid category "${category}".`);
      }
      if (!SLUG.test(entry.path.slice(category.length + 1))) {
        problems.push(`${file}: invalid slug in route ${route}.`);
      }
      if (!entry.keys) {
        problems.push(`${file}: missing i18n block for route ${route}.`);
        continue;
      }
      for (const field of I18N_FIELDS) {
        const key = entry.keys[field];
        if (!key || !KEY.test(key)) {
          problems.push(
            `${file}: invalid or missing i18n.${field} for route ${route}.`
          );
        } else if (!namespaces[key.split(':')[0]]) {
          problems.push(
            `${file}: unknown locale namespace in "${key}" for route ${route}.`
          );
        } else if (!translate(key)?.trim()) {
          problems.push(
            `${file}: missing English text for "${key}" (route ${route}).`
          );
        } else if (/\{\{|\$t\(/.test(translate(key))) {
          problems.push(
            `${file}: "${key}" uses i18n interpolation, which static HTML cannot resolve.`
          );
        }
      }
      for (const suffix of ['title', 'description']) {
        const key = `translation:categories.${category}.${suffix}`;
        if (!translate(key)?.trim()) {
          problems.push(
            `${file}: missing English text for "${key}" (category of route ${route}).`
          );
        }
      }
      tools.push({
        category,
        path: entry.path,
        nameKey: entry.keys.name,
        descriptionKey: entry.keys.description,
        shortDescriptionKey: entry.keys.shortDescription,
        metaFile: file,
        sources: [file, ...entry.sources],
        /** Files whose history defines the tool page's last modification. */
        contentPaths: entry.contentPaths
      });
    }
  }

  const seen = new Map();
  for (const tool of tools) {
    if (seen.has(tool.path)) {
      problems.push(
        `Duplicate route /${tool.path} in ${tool.metaFile} and ${seen.get(
          tool.path
        )}.`
      );
    }
    seen.set(tool.path, tool.metaFile);
  }
  if (problems.length) throw new DiscoveryError([...new Set(problems)]);
  return { tools, translate, namespaces };
}

/** Literal route paths declared in routesConfig.tsx. */
export async function discoverStaticRoutes(root = process.cwd()) {
  const source = await readFile(join(root, ROUTES_FILE), 'utf8');
  return [...source.matchAll(/\bpath:\s*'([^']+)'/g)].map((match) => match[1]);
}

/** Route patterns rendered by the app that are not static info pages. */
export const DYNAMIC_ROUTE_PATTERNS = ['/', '/categories/:categoryName', '*'];

/**
 * Checks that every static route of the router has SEO metadata and that no
 * SEO page definition is stale. Returns a list of problems.
 */
export function checkStaticRoutes(routePaths, infoPaths) {
  const problems = [];
  const known = new Set([...DYNAMIC_ROUTE_PATTERNS, ...infoPaths]);
  for (const path of routePaths) {
    if (!known.has(path)) {
      problems.push(
        `Route "${path}" in ${ROUTES_FILE} has no SEO definition; add it to src/seo/pages.ts.`
      );
    }
  }
  for (const path of [...DYNAMIC_ROUTE_PATTERNS, ...infoPaths]) {
    if (!routePaths.includes(path)) {
      problems.push(
        `SEO expects route "${path}" but ${ROUTES_FILE} does not declare it.`
      );
    }
  }
  return problems;
}
