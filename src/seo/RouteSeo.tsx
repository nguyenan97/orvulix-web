import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { tools } from '@tools/index';
import type { I18nNamespaces } from '../i18n';
import { applyHeadTags } from './dom';
import { getHeadTags } from './head';
import { developmentHeadTags } from './pages-dev';
import { normalizePath, resolveSeoPage } from './model';
import { availableClientPage, requiredSeoKeys } from './client-page';
import { SITE, absoluteUrl } from './config';
import { toolRecordsFromRegistry } from './records';
import { loadToolOverrides, useToolOverrides } from './useToolOverrides';

// Head metadata is owned by RouteSeo (see docs/SEO.md). Pages may still
// render <Helmet>; disabling its DOM writes keeps those tags from replacing
// or duplicating the metadata generated from src/seo.
Helmet.canUseDOM = false;

const records = toolRecordsFromRegistry(tools);

/**
 * Keeps <head> metadata in sync with the current route on the client using
 * the same model as the build-time HTML. Unavailable translations use a lazy
 * local English fallback; unrelated namespaces never block the active route.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const namespaces = useMemo(
    () =>
      [
        ...new Set([
          'translation',
          ...requiredSeoKeys(records, pathname).map((key) => key.split(':')[0])
        ])
      ] as I18nNamespaces[],
    [pathname]
  );
  const { i18n, ready } = useTranslation(namespaces, {
    useSuspense: false
  });
  const overrides = useToolOverrides(
    records.some((tool) => '/' + tool.path === normalizePath(pathname))
  );
  const language = i18n.resolvedLanguage ?? i18n.language;
  // Rebuild when translations arrive later (e.g. the English fallback for a
  // non-English UI), since `ready` can be true before they are loaded.
  const [resourcesVersion, setResourcesVersion] = useState(0);
  useEffect(() => {
    const onAdded = (_language: string, namespace: string) => {
      if (namespaces.includes(namespace as I18nNamespaces))
        setResourcesVersion((version) => version + 1);
    };
    i18n.store.on('added', onAdded);
    return () => i18n.store.off('added', onAdded);
  }, [i18n, namespaces]);

  const page = useMemo(() => {
    // Keys come from tool metadata at runtime, so the typed key union of
    // react-i18next does not apply here.
    const t = i18n.getFixedT(language) as unknown as (key: string) => string;
    const translate = (key: string) =>
      i18n.exists(key, { lng: language }) ? t(key) : undefined;
    const current = availableClientPage(
      {
        tools: records,
        translate,
        language,
        overrides: overrides ?? {}
      },
      pathname
    );
    return current?.kind === 'tool' && !overrides ? null : current;
    // resourcesVersion is a dependency so the model is rebuilt on new strings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, language, i18n, resourcesVersion, pathname]);

  useEffect(() => {
    let active = true;
    const apply = (value: NonNullable<typeof page>) => {
      if (!active) return;
      const tags = getHeadTags(value);
      applyHeadTags(
        document,
        import.meta.env.VITE_PAGES_DEV === 'true'
          ? developmentHeadTags(tags)
          : tags,
        value.language
      );
    };
    if (page) apply(page);
    else {
      // Keep correct prerendered metadata on direct load. On navigation,
      // remove the old identity immediately while the local fallback loads.
      const path = normalizePath(pathname);
      const canonical = document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href');
      if (canonical !== absoluteUrl(path)) {
        applyHeadTags(
          document,
          [
            { tag: 'title', attrs: {}, text: SITE.name },
            {
              tag: 'meta',
              attrs: {
                name: 'robots',
                content:
                  import.meta.env.VITE_PAGES_DEV === 'true'
                    ? 'noindex, follow'
                    : SITE.robotsIndex
              }
            }
          ],
          SITE.language
        );
      }
      // A correct direct-load head can wait for its normal namespace request.
      // Navigation needs a fresh identity even while the HTTP backend retries.
      if (!ready && canonical === absoluteUrl(path))
        return () => {
          active = false;
        };
      loadToolOverrides()
        .catch(() => ({}))
        .then(async (loaded) => {
          if (!active) return;
          const t = i18n.getFixedT(language) as unknown as (
            key: string
          ) => string;
          const translated = availableClientPage(
            {
              tools: records,
              translate: (key) =>
                i18n.exists(key, { lng: language }) ? t(key) : undefined,
              language,
              overrides: loaded
            },
            pathname
          );
          if (translated) {
            apply(translated);
            return;
          }
          const fallback = await import('./english-fallback');
          apply(
            resolveSeoPage(
              fallback.englishFallbackSite(records, loaded),
              pathname
            )
          );
        })
        .catch(() => {
          /* Correct initial metadata or neutral head is retained; never reuse another route. */
        });
    }
    return () => {
      active = false;
    };
  }, [page, pathname, ready, i18n, language]);

  return null;
}
