import { getLocales } from 'react-native-localize';

import type { SupportedLanguage } from './languages';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from './languages';
import { getStoredLanguage, persistLanguage } from './storage';

export interface LocaleCandidate {
  languageCode?: string;
  languageTag: string;
}

export function normalizeLanguage(locale: LocaleCandidate): SupportedLanguage | null {
  const candidate = locale.languageCode ?? locale.languageTag.split(/[-_]/)[0];
  const normalizedCandidate = candidate.toLowerCase();

  return isSupportedLanguage(normalizedCandidate) ? normalizedCandidate : null;
}

export function resolveLanguage(
  storedLanguage: unknown,
  locales: readonly LocaleCandidate[],
): SupportedLanguage {
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
}

export function resolveAndPersistLanguage(): SupportedLanguage {
  const language = resolveLanguage(getStoredLanguage(), getLocales());

  persistLanguage(language);

  return language;
}
