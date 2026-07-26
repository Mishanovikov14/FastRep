import type { SupportedLanguage } from '@/localization';

import { fonts, systemFonts } from './Fonts';
import type { Fonts } from './types';

export function resolveFonts(language: SupportedLanguage): Fonts {
  return language === 'uk' ? systemFonts : fonts;
}
