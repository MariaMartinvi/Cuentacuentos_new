import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './i18n/locales/en.json';
import esTranslations from './i18n/locales/es.json';
import caTranslations from './i18n/locales/ca.json';
import frTranslations from './i18n/locales/fr.json';
import itTranslations from './i18n/locales/it.json';
import deTranslations from './i18n/locales/de.json';

i18n
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
      }
    },
    lng: 'es', // idioma por defecto
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n; 