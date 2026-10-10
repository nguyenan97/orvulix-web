import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { HOME_SEO, INFO_PAGES_SEO, NOT_FOUND_SEO } from './pages';
import { splitSentences } from './text';

const normalize = (value: string) => value.replace(/\s+/g, ' ');

describe('static page copy matches what React renders', () => {
  it('uses the home page heading and sentences from the home components', () => {
    const home = normalize(
      readFileSync('src/pages/home/index.tsx', 'utf8') +
        readFileSync('src/brand/config.ts', 'utf8')
    );
    expect(home).toContain(HOME_SEO.heading);
    for (const sentence of splitSentences(HOME_SEO.intro)) {
      expect(home).toContain(sentence);
    }
  });

  it('uses the headings and intros of the information pages', () => {
    const info = normalize(
      readFileSync('src/pages/information/index.tsx', 'utf8')
    );
    for (const [path, page] of Object.entries(INFO_PAGES_SEO)) {
      expect(info, path).toContain(`'${page.heading}'`);
      expect(info, path).toContain(page.intro);
    }
    expect(info).toContain(NOT_FOUND_SEO.intro);
  });
});
