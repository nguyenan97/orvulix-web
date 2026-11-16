import {
  buildSeoSite,
  normalizePath,
  resolveSeoPage,
  type SeoInput
} from './model';
import type { ToolRecord } from './types';

/** Only the active route's strings can block its metadata. */
export function requiredSeoKeys(
  tools: ToolRecord[],
  pathname: string
): string[] {
  const path = normalizePath(pathname);
  const tool = tools.find((item) => '/' + item.path === path);
  if (tool)
    return [
      tool.nameKey,
      tool.descriptionKey,
      tool.shortDescriptionKey,
      `translation:categories.${tool.category}.title`,
      `translation:categories.${tool.category}.description`
    ];
  const category = path.startsWith('/categories/') ? path.slice(12) : '';
  const entries = tools.filter((item) => item.category === category);
  return entries.length
    ? [
        `translation:categories.${category}.title`,
        `translation:categories.${category}.description`,
        ...entries.flatMap((item) => [item.nameKey, item.shortDescriptionKey])
      ]
    : [];
}

export function availableClientPage(input: SeoInput, pathname: string) {
  if (
    requiredSeoKeys(input.tools, pathname).some(
      (key) => !input.translate(key)?.trim()
    )
  )
    return null;
  return resolveSeoPage(buildSeoSite(input, pathname).site, pathname);
}
