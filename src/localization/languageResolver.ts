import { getLocales } from 'react-native-localize';

import { DEFAULT_LANGUAGE, isSupportedLanguage } from './languages';
import { getStoredLanguage, persistLanguage } from './storage';
import type { LocaleCandidate, SupportedLanguage } from './types';

export const normalizeLanguage = (locale: LocaleCandidate): SupportedLanguage | null => {
  const candidate = locale.languageCode ?? locale.languageTag.split(/[-_]/)[0];
  const normalizedCandidate = candidate.toLowerCase();

  return isSupportedLanguage(normalizedCandidate) ? normalizedCandidate : null;
};

export const resolveLanguage = (
  storedLanguage: unknown,
  locales: readonly LocaleCandidate[],
): SupportedLanguage => {
  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage.toLowerCase() as SupportedLanguage;
  }

  for (const locale of locales) {
    const supportedLanguage = normalizeLanguage(locale);

    if (supportedLanguage) {
      return supportedLanguage;
    }
  }

  return DEFAULT_LANGUAGE;
};

export const resolveAndPersistLanguage = (): SupportedLanguage => {
  const language = resolveLanguage(getStoredLanguage(), getLocales());

  persistLanguage(language);

  return language;
};
