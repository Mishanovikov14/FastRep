import type { SupportedLanguage } from '@/localization/types';

import { fonts, systemFonts } from './Fonts';
import type { Fonts } from './types';

export const resolveFonts = (language: SupportedLanguage): Fonts => {
  return language === 'uk' ? systemFonts : fonts;
};
