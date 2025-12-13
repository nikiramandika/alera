import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './resources/en.json';
import id from './resources/id.json';

const resources = {
  en: { translation: en },
  id: { translation: id },
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: (Localization.locale && Localization.locale.split('-')[0]) || 'en', // Default to English
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes by default
  },
});

export default i18n;