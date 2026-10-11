import { buildSeoSite } from './model';
import { SITE } from './config';
import type { ToolRecord, ToolSeoOverride } from './types';

// A lazy Vite chunk, independent of the HTTP translation backend. This uses
// the same upstream English JSON files without modifying or duplicating them.
const resources = import.meta.glob('/public/locales/en/*.json', {
  eager: true,
  import: 'default'
});

export function englishFallbackSite(
  tools: ToolRecord[],
  overrides: Record<string, ToolSeoOverride>
) {
  const translate = (key: string) => {
    const [namespace, path] = key.split(':');
    let value: unknown = resources[`/public/locales/en/${namespace}.json`];
    for (const part of path.split('.'))
      value =
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[part]
          : undefined;
    return typeof value === 'string' ? value : undefined;
  };
  return buildSeoSite({ tools, overrides, translate, language: SITE.language })
    .site;
}
