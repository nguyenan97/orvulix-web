import i18n, { Namespace, ParseKeys } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import englishShell from '../../public/locales/en/translation.json';

export const validNamespaces = [
  'string',
  'number',
  'video',
  'list',
  'json',
  'time',
  'csv',
  'pdf',
  'audio',
  'xml',
  'translation',
  'image',
  'converters'
] as const satisfies readonly Namespace[];

export type I18nNamespaces = (typeof validNamespaces)[number];
export type FullI18nKey = {
  [K in I18nNamespaces]: `${K}:${ParseKeys<K>}`;
}[I18nNamespaces];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [
      'en',
      'de',
      'es',
      'fr',
      'pt',
      'ja',
      'hi',
      'nl',
      'ru',
      'uk',
      'zh'
    ],
    fallbackLng: 'en',
    // The shell need not wait for an HTTP round trip before discovering a route.
    // Other languages and tool namespaces still load through the existing backend.
    partialBundledLanguages: true,
    resources: { en: { translation: englishShell } },
    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json` // ORVULIX-PAGES
    },
    detection: {
      lookupLocalStorage: 'lang',
      caches: ['localStorage'] // cache the detected lang back to localStorage
    }
  });

export default i18n;
