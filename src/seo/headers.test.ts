import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  cacheRules,
  patternToRegExp,
  validateCacheHeaders
} from '../../scripts/seo/validate-headers.mjs';
import { validateFontPreload } from '../../scripts/seo/validate-dist.mjs';

const fixture = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'seo-headers-'));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
};

const site = () =>
  fixture({
    'public/assets/background.svg': '<svg/>',
    'public/assets/fonts/quicksand/quick-sand.css': '',
    'dist/assets/index-BHk-xvQA.js': '',
    'dist/assets/worker-AbCdEf12.mjs': '',
    'dist/assets/background.svg': '<svg/>',
    'dist/index.html': '<html></html>'
  });

describe('cache header guards', () => {
  it('accepts the project netlify.toml rules against public/', async () => {
    const toml = readFileSync('netlify.toml', 'utf8');
    const rules = cacheRules(toml);
    expect(
      rules.some((rule: { cacheControl: string }) =>
        /immutable/.test(rule.cacheControl)
      )
    ).toBe(true);
    const root = site();
    expect(
      await validateCacheHeaders(toml, {
        publicDir: 'public',
        distDir: join(root, 'dist')
      })
    ).toEqual([]);
  });

  it('rejects immutable caching of unhashed files and documents', async () => {
    const root = site();
    const problems = await validateCacheHeaders(
      '[[headers]]\n  for = "/assets/*"\n  [headers.values]\n    Cache-Control = "public, max-age=31536000, immutable"\n',
      { publicDir: join(root, 'public'), distDir: join(root, 'dist') }
    );
    expect(problems.join('\n')).toMatch(
      /unhashed public file \/assets\/background\.svg/
    );
    expect(problems.join('\n')).toMatch(
      /\/assets\/background\.svg, which has no content hash/
    );
  });

  it('rejects overlapping Cache-Control rules', async () => {
    const root = site();
    const rule = (pattern: string, value: string) =>
      `[[headers]]\n  for = "${pattern}"\n  [headers.values]\n    Cache-Control = "${value}"\n`;
    const problems = await validateCacheHeaders(
      rule('/assets/*.js', 'public, max-age=31536000, immutable') +
        rule('/*', 'public, max-age=0'),
      { publicDir: join(root, 'public'), distDir: join(root, 'dist') }
    );
    expect(problems.join('\n')).toMatch(/overlap/);
  });

  it('matches Netlify wildcards across path segments', () => {
    expect(
      patternToRegExp('/assets/*.js').test('/assets/a/b-12345678.js')
    ).toBe(true);
    expect(patternToRegExp('/assets/*.js').test('/assets/a.css')).toBe(false);
  });
});

describe('font preload guard', () => {
  const css =
    '@font-face { font-style: normal; src: url("Regular.ttf"); }\n@font-face { font-style: italic; src: url("Italic.ttf"); }';
  const html = (href: string, extra = 'crossorigin') =>
    `<link rel="preload" href="${href}" as="font" type="font/ttf" ${extra} /><link href="/assets/fonts/f.css" rel="stylesheet" />`;
  const root = fixture({
    'dist/assets/fonts/f.css': css,
    'dist/assets/fonts/Regular.ttf': 'x',
    'dist/assets/fonts/Italic.ttf': 'x'
  });

  it('accepts a preload of the regular font used by the stylesheet', async () => {
    expect(
      await validateFontPreload(
        html('/assets/fonts/Regular.ttf'),
        join(root, 'dist')
      )
    ).toEqual([]);
  });

  it('rejects missing files, italic-only fonts and missing crossorigin', async () => {
    const dist = join(root, 'dist');
    expect(
      (
        await validateFontPreload(html('/assets/fonts/Missing.ttf'), dist)
      ).join()
    ).toMatch(/does not exist/);
    expect(
      (await validateFontPreload(html('/assets/fonts/Italic.ttf'), dist)).join()
    ).toMatch(/not used/);
    expect(
      (
        await validateFontPreload(html('/assets/fonts/Regular.ttf', ''), dist)
      ).join()
    ).toMatch(/crossorigin/);
  });
});
