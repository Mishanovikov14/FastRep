import type { SupportedLanguage } from '@/localization';

export interface LanguageOption {
  code: SupportedLanguage;
  translationKey:
    | 'languages.english'
    | 'languages.french'
    | 'languages.german'
    | 'languages.spanish'
    | 'languages.ukrainian';
}
