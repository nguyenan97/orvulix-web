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
      .map((file) =>
        relative(CONTENT_DIR, file).replace(/\\/g, '/').replace(/\.ts$/, '')
      )
      .sort();
    expect(Object.keys(TOOL_OVERRIDES).sort()).toEqual(files);
  });

  it('only targets tools that exist', () => {
    const paths = new Set(tools.map((tool) => tool.path));
    for (const path of Object.keys(TOOL_OVERRIDES)) {
      expect(paths.has(path), path).toBe(true);
    }
  });

  it('requires the separate PDF editor external-service disclosure', () => {
    const disclosure = TOOL_OVERRIDES['pdf/editor'];
    expect(disclosure).toBeDefined();
    expect(disclosure.description).toContain('external PDF editor');
    expect(disclosure.notes.join(' ')).toContain('document fingerprint');
    expect(disclosure.notes.join(' ')).toContain('until you enable it');
  });

  it('keeps hand-written content complete and free of unverifiable wording', () => {
    // 30 original editorial pages plus workflow and Docker; PDF disclosure is separate.
    const editorial = Object.keys(TOOL_OVERRIDES).filter(
      (path) => path !== 'pdf/editor'
    );
    expect(editorial.length).toBeGreaterThanOrEqual(20);
    expect(editorial.length).toBe(32);
    expect(TOOL_OVERRIDES['string/text-workflow'].notes.join(' ')).toContain(
      'five-second deadline'
    );
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
