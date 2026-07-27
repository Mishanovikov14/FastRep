import { useCallback, useEffect, useMemo, useState } from 'react';

import { i18n, initializeLocalization } from '@/localization/i18n';
import { DEFAULT_LANGUAGE } from '@/localization/languages';
import { persistLanguage } from '@/localization/storage';
import type { SupportedLanguage } from '@/localization/types';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import { languages } from './config';
import { colors } from './theme/Colors';
import { fontFamilies } from './theme/Fonts';
import { resolveFonts } from './theme/resolveFonts';
import type { IProps, UIContextValue } from './types';
import { UIContext } from './UIContext';

export const UIProvider = ({ children }: IProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [language, setCurrentLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let isMounted = true;

    initializeLocalization().then((resolvedLanguage) => {
      if (isMounted) {
        setCurrentLanguage(resolvedLanguage);
        setIsInitialized(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: SupportedLanguage) => {
    await i18n.changeLanguage(nextLanguage);
    persistLanguage(nextLanguage);
    setCurrentLanguage(nextLanguage);
  }, []);

  const resolvedFonts = useMemo(() => resolveFonts(language), [language]);

  const value = useMemo<UIContextValue>(
    () => ({
      colors,
      fontFamilies,
      fonts: resolvedFonts,
      isInitialized,
      language,
      languages,
      radius,
      setLanguage,
      spacing,
      t: i18n.t,
    }),
    [isInitialized, language, resolvedFonts, setLanguage],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
