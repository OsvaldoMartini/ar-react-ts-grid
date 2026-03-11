// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'de', 'fr', 'it', 'pt'],
    fallbackLng: 'en',
    load: 'languageOnly',   // strips region codes: "en-US" → "en"

    defaultNS: 'capi',
    ns: ['capi'],

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'capi-lang',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,   // CapiShell handles its own loading guard
    },
  });

export default i18n;