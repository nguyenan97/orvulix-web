import type { DefinedTool } from '@tools/defineTool';
import type { ToolRecord } from './types';

/** Converts the app's tool registry into the records used by the SEO model. */
export const toolRecordsFromRegistry = (tools: DefinedTool[]): ToolRecord[] =>
  tools.map((tool) => ({
    category: tool.type,
    path: tool.path,
    nameKey: tool.name,
    descriptionKey: tool.description,
    shortDescriptionKey: tool.shortDescription
  }));
