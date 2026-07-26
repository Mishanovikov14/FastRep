import { supportedLanguages } from '@/localization/config';
import type { SupportedLanguage } from '@/localization/types';

import type { LanguageOption } from './types';

const languageTranslationKeys = {
  de: 'languages.german',
  en: 'languages.english',
  es: 'languages.spanish',
  fr: 'languages.french',
  uk: 'languages.ukrainian',
} as const satisfies Record<SupportedLanguage, LanguageOption['translationKey']>;

export const languages: readonly LanguageOption[] = supportedLanguages.map((code) => ({
  code,
  translationKey: languageTranslationKeys[code],
}));
