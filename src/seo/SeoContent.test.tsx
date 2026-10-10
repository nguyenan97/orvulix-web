import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { discoverTools } from '../../scripts/seo/discover.mjs';
import { buildSeoSite, resolveSeoPage } from './model';
import { TOOL_OVERRIDES } from './overrides';
import SeoContent from './SeoContent';
import { renderStaticRoot } from './static-html';

const i18n = async (lng: string) => {
  const instance = i18next.createInstance().use(initReactI18next);
  await instance.init({ lng, fallbackLng: 'en', resources: { [lng]: {} } });
  return instance;
};

const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

describe('SeoContent', () => {
  it('renders the same text as the static HTML of the tool page', async () => {
    const { tools, translate } = await discoverTools();
    const { site } = buildSeoSite({
      tools,
      translate,
      language: 'en',
      overrides: TOOL_OVERRIDES
    });
    const paths = Object.keys(TOOL_OVERRIDES);
    expect(paths.length).toBeGreaterThanOrEqual(20);
    for (const path of paths) {
      const page = resolveSeoPage(site, `/${path}`);
      const { unmount } = render(
        <I18nextProvider i18n={await i18n('en')}>
          <SeoContent path={path} toolName={page.heading} />
        </I18nextProvider>
      );
      const block = await screen.findByTestId('seo-content');
      const staticText = textOf(
        renderStaticRoot({ ...page, breadcrumbs: [], links: [] })
      );
      expect(block.textContent?.replace(/\s+/g, '')).toBe(
        staticText.replace(/\s+/g, '')
      );
      expect(block.querySelectorAll('h1')).toHaveLength(0);
      expect(block.querySelectorAll('h2').length).toBe(page.sections.length);
      unmount();
    }
  });

  it('renders nothing for tools without an override or for other languages', async () => {
    const path = Object.keys(TOOL_OVERRIDES)[0];
    const { container: otherLanguage } = render(
      <I18nextProvider i18n={await i18n('de')}>
        <SeoContent path={path} toolName="x" />
      </I18nextProvider>
    );
    const { container: noOverride } = render(
      <I18nextProvider i18n={await i18n('en')}>
        <SeoContent path="string/no-such-tool" toolName="x" />
      </I18nextProvider>
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(otherLanguage.innerHTML).toBe('');
    expect(noOverride.innerHTML).toBe('');
  });
});
