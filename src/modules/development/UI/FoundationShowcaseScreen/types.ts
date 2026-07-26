import type { TFunction } from 'i18next';

import type { SupportedLanguage } from '@/localization/types';
import type { TypographyWeight } from '@/UIKit';
import type { LanguageOption } from '@/UIProvider/types';

export interface IFontLanguageSample {
  code: SupportedLanguage;
  label: string;
  text: string;
}

export interface IFontWeightSample {
  label: string;
  weight: TypographyWeight;
}

export interface ILanguageControl {
  code: SupportedLanguage;
  disabled: boolean;
  onPress(): void;
  title: string;
}

export interface IPresenterInput {
  language: SupportedLanguage;
  languages: readonly LanguageOption[];
  setLanguage(language: SupportedLanguage): Promise<void>;
  t: TFunction;
}
