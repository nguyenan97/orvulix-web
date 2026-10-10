#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkStaticRoutes,
  discoverStaticRoutes,
  discoverTools
} from './discover.mjs';
import { loadSeoCore } from './load-core.mjs';

/**
 * Writes one static HTML file per indexable route into dist/ after
 * `vite build`, using dist/index.html as the template, plus dist/404.html.
 * No React rendering happens here: metadata, JSON-LD and static content come
 * from src/seo.
 *
 * Routes are written as dist/<route>.html (the homepage stays
 * dist/index.html). With Netlify's default Pretty URLs a directory index
 * (dist/<route>/index.html) would answer /<route> with a 301 to /<route>/,
 * changing every existing URL; a flat file is served at /<route> with 200
 * and /<route>/ is redirected to it. See docs/SEO.md.
 */

const DIST = resolve('dist');

const fail = (message) => {
  console.error(`\n[seo] ${message}\n`);
  process.exit(1);
};

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/** Builds and validates the SEO model shared by the build scripts. */
export async function loadSeoSite() {
  const core = await loadSeoCore();
  const { tools, translate, unregistered } = await discoverTools();
  if (unregistered.length) {
    console.warn(
      `[seo] Skipping ${
        unregistered.length
      } tool(s) whose meta file is not registered in src/tools/index.ts: ${unregistered
        .map((tool) => `/${tool.path}`)
        .join(', ')}`
    );
  }
  const routeProblems = checkStaticRoutes(
    await discoverStaticRoutes(),
    Object.keys(core.INFO_PAGES_SEO)
  );
  const { site, issues } = core.buildSeoSite({
    tools,
    translate,
    language: core.SITE.language,
    overrides: core.TOOL_OVERRIDES
  });
  const problems = [...routeProblems, ...issues, ...core.validateSeoSite(site)];
  if (problems.length) {
    throw new Error(
      `Invalid SEO metadata:\n  - ${[...new Set(problems)].join('\n  - ')}`
    );
  }
  return { core, site, tools };
}

/** dist file served for a route path. */
export const htmlFileForPath = (path) =>
  path === '/'
    ? join(DIST, 'index.html')
    : `${join(DIST, ...path.slice(1).split('/'))}.html`;

export const NOT_FOUND_FILE = join(DIST, '404.html');

async function main() {
  const templatePath = join(DIST, 'index.html');
  if (!(await exists(templatePath)))
    fail('dist/index.html not found; run `vite build` first.');
  const template = await readFile(templatePath, 'utf8');
  if (template.includes('data-seo-static')) {
    fail(
      'dist/index.html was already processed; run `vite build` again before prerendering.'
    );
  }

  let model;
  try {
    model = await loadSeoSite();
  } catch (error) {
    fail(error.message);
  }
  const { core, site } = model;

  const counts = {};
  for (const page of site.pages) {
    const file = htmlFileForPath(page.path);
    if (!file.startsWith(DIST + sep))
      fail(`Route ${page.path} resolves outside dist/.`);
    if (page.path !== '/' && (await exists(file))) {
      fail(
        `Refusing to overwrite ${relative(process.cwd(), file)} for route ${
          page.path
        }.`
      );
    }
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, core.renderDocument(template, page));
    counts[page.kind] = (counts[page.kind] ?? 0) + 1;
  }

  if (await exists(NOT_FOUND_FILE)) {
    fail('Refusing to overwrite an existing dist/404.html.');
  }
  await writeFile(NOT_FOUND_FILE, core.renderDocument(template, site.notFound));

  const summary = Object.entries(counts)
    .map(([kind, count]) => `${kind} ${count}`)
    .join(', ');
  console.log(
    `[seo] Prerendered ${site.pages.length} indexable routes (${summary}) and 404.html.`
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
