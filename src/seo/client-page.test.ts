import { describe, expect, it } from 'vitest';
import { availableClientPage } from './client-page';
import { discoverTools } from '../../scripts/seo/discover.mjs';
import { absoluteUrl } from './config';
import { buildSeoSite } from './model';
import { TOOL_OVERRIDES } from './overrides';

describe('route-specific metadata availability', () => {
  it('does not resolve unrelated tool text while building homepage or active-tool metadata', async () => {
    const { tools, translate } = await discoverTools();
    const keys: string[] = [];
    const input = {
      tools,
      language: 'en',
      overrides: {},
      translate: (key: string) => {
        keys.push(key);
        return translate(key);
      }
    };
    expect(availableClientPage(input, '/')?.canonical).toBe(absoluteUrl('/'));
    expect(keys.filter((key) => !key.startsWith('translation:'))).toEqual([]);
    keys.length = 0;
    expect(availableClientPage(input, '/string/uppercase')?.canonical).toBe(
      absoluteUrl('/string/uppercase')
    );
    expect(keys.filter((key) => !/^(translation|string):/.test(key))).toEqual(
      []
    );
  });
  it('keeps each client page identical to the full prerender model', async () => {
    const { tools, translate } = await discoverTools();
    for (const language of ['en', 'de']) {
      const input = { tools, translate, language, overrides: TOOL_OVERRIDES };
      const full = buildSeoSite(input).site;
      for (const page of full.pages)
        expect(availableClientPage(input, page.path)).toEqual(page);
      expect(availableClientPage(input, '/missing')).toEqual(full.notFound);
    }
  });
  it('updates home and information metadata even when an unrelated namespace fails', async () => {
    const { tools, translate } = await discoverTools();
    const input = {
      tools,
      language: 'en',
      overrides: {},
      translate: (key: string) =>
        key.startsWith('audio:') ? undefined : translate(key)
    };
    expect(availableClientPage(input, '/')?.canonical).toBe(absoluteUrl('/'));
    expect(availableClientPage(input, '/about')?.canonical).toBe(
      absoluteUrl('/about')
    );
    expect(availableClientPage(input, '/string/uppercase')?.canonical).toBe(
      absoluteUrl('/string/uppercase')
    );
  });
  it('uses fallback when the active tool lacks text and handles unknown routes independently', async () => {
    const { tools, translate } = await discoverTools();
    const input = {
      tools,
      language: 'en',
      overrides: {},
      translate: (key: string) =>
        key.startsWith('string:') ? undefined : translate(key)
    };
    expect(availableClientPage(input, '/string/uppercase')).toBeNull();
    expect(availableClientPage(input, '/missing')?.robots).toContain('noindex');
  });
});
