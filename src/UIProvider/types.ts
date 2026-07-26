import type { TFunction } from 'i18next';

import type { SupportedLanguage } from '@/localization';

import type { LanguageOption } from './localization/types';
import type { Colors, FontFamilies, Fonts, Radius, Spacing } from './theme';

export interface UIContextValue {
  colors: Colors;
  fontFamilies: FontFamilies;
  fonts: Fonts;
  isInitialized: boolean;
  language: SupportedLanguage;
  languages: readonly LanguageOption[];
  radius: Radius;
  setLanguage(language: SupportedLanguage): Promise<void>;
  spacing: Spacing;
  t: TFunction;
}
