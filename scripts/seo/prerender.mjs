#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import {
  checkStaticRoutes,
  discoverStaticRoutes,
  discoverTools
} from './discover.mjs';
import { loadSeoCore } from './load-core.mjs';

/**
 * Writes one static HTML file per indexable route into dist/ after
 * `vite build`, using dist/index.html as the template. No React rendering
 * happens here: metadata, JSON-LD and static content come from src/seo.
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
  const { tools, translate } = await discoverTools();
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
    : join(DIST, ...path.slice(1).split('/'), 'index.html');

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

  const summary = Object.entries(counts)
    .map(([kind, count]) => `${kind} ${count}`)
    .join(', ');
  console.log(
    `[seo] Prerendered ${site.pages.length} indexable routes (${summary}).`
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)
) {
  await main();
}
