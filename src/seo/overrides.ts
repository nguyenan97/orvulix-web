import type { ToolSeoOverride } from './types';

/**
 * Hand-written SEO metadata and content, keyed by tool route path without
 * the leading slash (e.g. `json/prettify`). Tools without an entry get
 * metadata generated from their English locale strings.
 */
export const TOOL_OVERRIDES: Record<string, ToolSeoOverride> = {};
