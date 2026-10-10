import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { tools } from '@tools/index';
import { validNamespaces } from '../i18n';
import { applyHeadTags } from './dom';
import { getHeadTags } from './head';
import { buildSeoSite, resolveSeoPage } from './model';
import { toolRecordsFromRegistry } from './records';
import { useToolOverrides } from './useToolOverrides';

// Head metadata is owned by RouteSeo (see docs/SEO.md). Pages may still
// render <Helmet>; disabling its DOM writes keeps those tags from replacing
// or duplicating the metadata generated from src/seo.
Helmet.canUseDOM = false;

const records = toolRecordsFromRegistry(tools);

/**
 * Keeps <head> metadata in sync with the current route on the client using
 * the same model as the build-time HTML. Until translations and overrides
 * are available it changes nothing, so prerendered metadata stays in place.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const { i18n, ready } = useTranslation(validNamespaces, {
    useSuspense: false
  });
  const overrides = useToolOverrides();
  const language = i18n.resolvedLanguage ?? i18n.language;

  const site = useMemo(() => {
    if (!ready || !overrides) return null;
    // Keys come from tool metadata at runtime, so the typed key union of
    // react-i18next does not apply here.
    const t = i18n.getFixedT(language) as unknown as (key: string) => string;
    const translate = (key: string) =>
      i18n.exists(key, { lng: language }) ? t(key) : undefined;
    return buildSeoSite({ tools: records, translate, language, overrides })
      .site;
  }, [ready, overrides, language, i18n]);

  useEffect(() => {
    if (!site) return;
    const page = resolveSeoPage(site, pathname);
    applyHeadTags(document, getHeadTags(page), page.language);
  }, [site, pathname]);

  return null;
}
