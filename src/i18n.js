import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './i18n/locales/en.json';
import esTranslations from './i18n/locales/es.json';
import caTranslations from './i18n/locales/ca.json';
import frTranslations from './i18n/locales/fr.json';
import itTranslations from './i18n/locales/it.json';
import deTranslations from './i18n/locales/de.json';
import glTranslations from './i18n/locales/gl.json';
import euTranslations from './i18n/locales/eu.json';
import ptTranslations from './i18n/locales/pt.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      es: {
        translation: esTranslations
      },
      ca: {
        translation: caTranslations
      },
      fr: {
        translation: frTranslations
      },
      it: {
        translation: itTranslations
      },
      de: {
        translation: deTranslations
      },
      gl: {
        translation: glTranslations
      },
      eu: {
        translation: euTranslations
      },
      pt: {
        translation: ptTranslations
      }
    },
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n; 