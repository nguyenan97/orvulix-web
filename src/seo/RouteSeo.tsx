import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { tools } from '@tools/index';
import { validNamespaces } from '../i18n';
import { applyHeadTags } from './dom';
import { getHeadTags } from './head';
import { developmentHeadTags } from './pages-dev';
import { normalizePath, resolveSeoPage } from './model';
import { availableClientPage } from './client-page';
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
  const { i18n } = useTranslation(validNamespaces, {
    useSuspense: false
  });
  const overrides = useToolOverrides();
  const language = i18n.resolvedLanguage ?? i18n.language;
  // Rebuild when translations arrive later (e.g. the English fallback for a
  // non-English UI), since `ready` can be true before they are loaded.
  const [resourcesVersion, setResourcesVersion] = useState(0);
  useEffect(() => {
    const onAdded = () => setResourcesVersion((version) => version + 1);
    i18n.store.on('added', onAdded);
    return () => i18n.store.off('added', onAdded);
  }, [i18n]);

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
      Promise.all([
        import('./english-fallback'),
        loadToolOverrides().catch(() => ({}))
      ])
        .then(([fallback, loaded]) =>
          apply(
            resolveSeoPage(
              fallback.englishFallbackSite(records, loaded),
              pathname
            )
          )
        )
        .catch(() => {
          /* Correct initial metadata or neutral head is retained; never reuse another route. */
        });
    }
    return () => {
      active = false;
    };
  }, [page, pathname]);

  return null;
}
