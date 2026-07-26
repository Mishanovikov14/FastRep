import type { supportedLanguages } from './config';

export interface LocaleCandidate {
  languageCode?: string;
  languageTag: string;
}

export type SupportedLanguage = (typeof supportedLanguages)[number];
