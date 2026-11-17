import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { HOME_SEO, INFO_PAGES_SEO, NOT_FOUND_SEO } from './pages';
import {
  privacyPolicy,
  termsAndConditions
} from '../pages/information/legal-content';
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
      if (path === '/json-assistant' || path === '/regex-assistant') {
        const demo = readFileSync(`src/ai${path}/copy.ts`, 'utf8');
        expect(demo).toContain(page.heading);
        expect(demo).toContain(page.intro);
        continue;
      }
      if (path === '/privacy' || path === '/terms') {
        expect(info).toContain(
          path === '/privacy'
            ? 'privacyPolicy.title'
            : 'termsAndConditions.title'
        );
        continue;
      }
      expect(info, path).toContain(`'${page.heading}'`);
      expect(info, path).toContain(page.intro);
    }
    expect(info).toContain(NOT_FOUND_SEO.intro);
  });

  it('uses the same legal copy in the React pages and static HTML definitions', () => {
    expect(INFO_PAGES_SEO['/privacy'].sections).toEqual(privacyPolicy.sections);
    expect(INFO_PAGES_SEO['/terms'].sections).toEqual(
      termsAndConditions.sections
    );
    expect(INFO_PAGES_SEO['/terms'].heading).toBe('Terms and Conditions');
    expect(privacyPolicy.contactEmail).toBe('99shadow.friend99@gmail.com');
    expect(termsAndConditions.contactEmail).toBe('99shadow.friend99@gmail.com');
  });
});
