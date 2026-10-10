import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tools } from '@tools/index';
import routes from '../config/routesConfig';
import {
  checkStaticRoutes,
  discoverStaticRoutes,
  discoverTools
} from '../../scripts/seo/discover.mjs';
import { INFO_PAGES_SEO } from './pages';
import { toolRecordsFromRegistry } from './records';

const byPath = <T extends { path: string }>(items: T[]) =>
  [...items].sort((a, b) => a.path.localeCompare(b.path));

describe('SEO tool discovery', () => {
  it('finds exactly the tools registered in the app, with the same i18n keys', async () => {
    const { tools: discovered } = await discoverTools();
    const registry = byPath(toolRecordsFromRegistry(tools));
    expect(
      byPath(discovered).map(
        ({ category, path, nameKey, descriptionKey, shortDescriptionKey }) => ({
          category,
          path,
          nameKey,
          descriptionKey,
          shortDescriptionKey
        })
      )
    ).toEqual(registry);
  });

  it('expands generated tools instead of emitting the generator path', async () => {
    const { tools: discovered } = await discoverTools();
    const paths = discovered.map((tool) => tool.path);
    expect(paths.some((path) => path.endsWith('generic-calc/'))).toBe(false);
    const generated = discovered.filter((tool) =>
      tool.path.startsWith('number/generic-calc/')
    );
    expect(generated.length).toBeGreaterThan(0);
    for (const tool of generated) {
      expect(tool.sources.length).toBeGreaterThan(1);
    }
  });

  it('fails with the file name when metadata has an unsupported shape', async () => {
    const root = await mkdtemp(join(tmpdir(), 'seo-discovery-'));
    await cp('public/locales/en', join(root, 'public/locales/en'), {
      recursive: true
    });
    await mkdir(join(root, 'src/pages/tools/string/broken'), {
      recursive: true
    });
    await writeFile(
      join(root, 'src/pages/tools/string/broken/meta.ts'),
      "export const tool = defineTool('string', { path: someVariable, i18n: {} });"
    );
    await expect(discoverTools(root)).rejects.toThrow(
      /src\/pages\/tools\/string\/broken\/meta\.ts: expected exactly one literal path/
    );
  });

  it('fails when a tool references a missing English string', async () => {
    const root = await mkdtemp(join(tmpdir(), 'seo-discovery-'));
    await cp('public/locales/en', join(root, 'public/locales/en'), {
      recursive: true
    });
    await mkdir(join(root, 'src/pages/tools/string/ghost'), {
      recursive: true
    });
    await writeFile(
      join(root, 'src/pages/tools/string/ghost/meta.ts'),
      `export const tool = defineTool('string', {
  path: 'ghost',
  i18n: {
    name: 'string:ghost.title',
    description: 'string:ghost.description',
    shortDescription: 'string:ghost.shortDescription'
  }
});`
    );
    await expect(discoverTools(root)).rejects.toThrow(
      /missing English text for "string:ghost\.title" \(route \/string\/ghost\)/
    );
  });
});

describe('SEO tool registry', () => {
  const meta = (slug: string) => `export const tool = defineTool('string', {
  path: '${slug}',
  i18n: {
    name: 'string:uppercase.title',
    description: 'string:uppercase.description',
    shortDescription: 'string:uppercase.shortDescription'
  }
});`;

  const fixture = async (registry: string) => {
    const root = await mkdtemp(join(tmpdir(), 'seo-registry-'));
    await cp('public/locales/en', join(root, 'public/locales/en'), {
      recursive: true
    });
    for (const slug of ['one', 'two']) {
      await mkdir(join(root, `src/pages/tools/string/${slug}`), {
        recursive: true
      });
      await writeFile(
        join(root, `src/pages/tools/string/${slug}/meta.ts`),
        meta(slug)
      );
    }
    await writeFile(join(root, 'src/pages/tools/string/index.ts'), registry);
    await mkdir(join(root, 'src/tools'), { recursive: true });
    await writeFile(
      join(root, 'src/tools/index.ts'),
      "import { stringTools } from '../pages/tools/string';\nexport const tools: DefinedTool[] = [\n  ...stringTools\n];\n"
    );
    return root;
  };

  it('skips tools that are commented out of the registry and reports them', async () => {
    const root = await fixture(
      "import { tool as one } from './one/meta';\nimport { tool as two } from './two/meta';\nexport const stringTools = [\n  one,\n  // two\n];\n"
    );
    const { tools: found, unregistered } = await discoverTools(root);
    expect(found.map((tool) => tool.path)).toEqual(['string/one']);
    expect(unregistered.map((tool: { path: string }) => tool.path)).toEqual([
      'string/two'
    ]);
  });

  it('fails when the registry cannot be resolved', async () => {
    const root = await fixture(
      "import { tool as one } from './one/meta';\nexport const stringTools = [one, missing];\n"
    );
    await expect(discoverTools(root)).rejects.toThrow(
      /"missing" is not imported/
    );
  });
});

describe('SEO static routes', () => {
  it('covers every route declared by the router', async () => {
    const declared = routes.map((route) => route.path as string);
    expect(await discoverStaticRoutes()).toEqual(declared);
    expect(checkStaticRoutes(declared, Object.keys(INFO_PAGES_SEO))).toEqual(
      []
    );
  });

  it('reports router routes without SEO metadata and stale SEO pages', () => {
    const problems = checkStaticRoutes(
      ['/', '/categories/:categoryName', '*', '/about', '/new-page'],
      ['/about', '/removed']
    );
    expect(problems.join('\n')).toMatch(/"\/new-page".*no SEO definition/);
    expect(problems.join('\n')).toMatch(/"\/removed".*does not declare it/);
  });
});
