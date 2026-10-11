import { describe, expect, it } from 'vitest';
import { availableClientPage } from './client-page';
import { discoverTools } from '../../scripts/seo/discover.mjs';
import { absoluteUrl } from './config';

describe('route-specific metadata availability', () => {
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
