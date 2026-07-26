import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

import type { SupportedLanguage } from '@/localization/types';

import type { Colors, FontFamilies, Fonts, Radius, Spacing } from './theme/types';

export interface LanguageOption {
  code: SupportedLanguage;
  translationKey:
    | 'languages.english'
    | 'languages.french'
    | 'languages.german'
    | 'languages.spanish'
    | 'languages.ukrainian';
}

export interface IProps {
  children?: ReactNode;
}

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
