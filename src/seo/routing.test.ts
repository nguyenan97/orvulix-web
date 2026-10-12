import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { findCatchAllRewrites } from '../../scripts/seo/validate-dist.mjs';
import { htmlFileForPath } from '../../scripts/seo/prerender.mjs';

describe('Netlify routing for prerendered pages', () => {
  it('has no catch-all rewrite that would hide HTTP 404 responses', () => {
    expect(
      findCatchAllRewrites(
        readFileSync('public/_redirects', 'utf8'),
        readFileSync('netlify.toml', 'utf8')
      )
    ).toEqual([]);
  });

  it('detects SPA fallbacks in _redirects and netlify.toml', () => {
    expect(findCatchAllRewrites('/*    /index.html   200\n', '')).toHaveLength(
      1
    );
    expect(
      findCatchAllRewrites(
        '# comment only\n',
        '[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n'
      )
    ).toHaveLength(1);
    expect(findCatchAllRewrites('/old /new 301\n', '')).toEqual([]);
  });

  it('writes non-home routes as flat .html files to keep URLs without a trailing slash', () => {
    expect(htmlFileForPath('/')).toMatch(/dist\/index\.html$/);
    expect(htmlFileForPath('/string/uppercase')).toMatch(
      /dist\/string\/uppercase\.html$/
    );
    expect(htmlFileForPath('/categories/json')).toMatch(
      /dist\/categories\/json\.html$/
    );
  });
});
