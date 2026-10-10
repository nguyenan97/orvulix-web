import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tools } from '@tools/index';
import { TOOL_OVERRIDES } from './overrides';

const CONTENT_DIR = 'src/seo/tool-content';

const contentFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? contentFiles(path) : [path];
  });

describe('tool SEO overrides', () => {
  it('registers every tool-content file under its own route path', () => {
    const files = contentFiles(CONTENT_DIR)
      .map((file) => relative(CONTENT_DIR, file).replace(/\.ts$/, ''))
      .sort();
    expect(Object.keys(TOOL_OVERRIDES).sort()).toEqual(files);
  });

  it('only targets tools that exist', () => {
    const paths = new Set(tools.map((tool) => tool.path));
    for (const path of Object.keys(TOOL_OVERRIDES)) {
      expect(paths.has(path), path).toBe(true);
    }
  });

  it('keeps hand-written content complete and free of unverifiable wording', () => {
    expect(Object.keys(TOOL_OVERRIDES).length).toBeGreaterThanOrEqual(20);
    expect(Object.keys(TOOL_OVERRIDES).length).toBeLessThanOrEqual(30);
    for (const [path, override] of Object.entries(TOOL_OVERRIDES)) {
      expect(override.title.endsWith(' | Orvulix'), path).toBe(true);
      expect(override.howTo.length, path).toBeGreaterThanOrEqual(3);
      expect(override.notes.length, path).toBeGreaterThanOrEqual(2);
      const text = JSON.stringify(override);
      expect(text, path).not.toMatch(
        /\b(best|ultimate|world'?s|100% (private|secure)|never leaves? your)\b/i
      );
    }
  });
});
