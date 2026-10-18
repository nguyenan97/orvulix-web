import { describe, expect, it } from 'vitest';
import { failedModuleUrls } from './recover';

describe('explicit route recovery asset boundary', () => {
  it('refreshes only failed/missing JS preloads, with deduplication and a Pages prefix', () => {
    const origin = 'https://example.test';
    expect(
      failedModuleUrls(
        [
          '/orvulix-web/assets/loaded.js',
          '/orvulix-web/assets/failed.js',
          '/orvulix-web/assets/failed.js',
          '/orvulix-web/assets/missing.mjs',
          '/assets/outside.js',
          '/orvulix-web/assets/font.woff2',
          'https://other.test/orvulix-web/assets/remote.js',
          'https://user:password@example.test/orvulix-web/assets/credentials.js',
          '/orvulix-web/assets/../private.js',
          '/orvulix-web/assets/file.js?secret=value',
          'javascript:alert(1)',
          '/orvulix-web/assets/file.js#hash'
        ],
        [
          {
            name: origin + '/orvulix-web/assets/loaded.js',
            decodedBodySize: 100
          },
          { name: origin + '/orvulix-web/assets/failed.js', decodedBodySize: 0 }
        ],
        origin,
        '/orvulix-web/'
      )
    ).toEqual([
      origin + '/orvulix-web/assets/failed.js',
      origin + '/orvulix-web/assets/missing.mjs'
    ]);
  });
  it('bounds explicit recovery work and supports root-hosted assets', () => {
    expect(
      failedModuleUrls(
        Array.from({ length: 50 }, (_, i) => `/assets/${i}.js`),
        [],
        'https://example.test',
        '/'
      )
    ).toHaveLength(32);
    expect(
      failedModuleUrls(
        ['/assets/ok.js'],
        [{ name: 'https://example.test/assets/ok.js', decodedBodySize: 1 }],
        'https://example.test',
        '/'
      )
    ).toEqual([]);
  });
});
