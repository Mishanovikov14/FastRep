import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveAndPersistLanguage } from './languageResolver';
import { DEFAULT_LANGUAGE, supportedLanguages } from './languages';
import { de } from './resources/de';
import { en } from './resources/en';
import { es } from './resources/es';
import { fr } from './resources/fr';
import { uk } from './resources/uk';
import type { SupportedLanguage } from './types';

export const i18n = i18next.createInstance();

let initializationPromise: Promise<SupportedLanguage> | null = null;

export function initializeLocalization(): Promise<SupportedLanguage> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const language = resolveAndPersistLanguage();

    await i18n.use(initReactI18next).init({
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: {
        escapeValue: false,
      },
      lng: language,
      resources: {
        de: { translation: de },
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        uk: { translation: uk },
      },
      returnNull: false,
      supportedLngs: [...supportedLanguages],
    });

    return language;
  })();

  return initializationPromise;
}
