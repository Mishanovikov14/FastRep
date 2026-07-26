import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SupportedLanguage } from '@/localization';
import { DEFAULT_LANGUAGE, i18n, initializeLocalization, persistLanguage } from '@/localization';
import { radius, spacing } from '@/theme';

import { languages } from './config';
import { colors, fontFamilies } from './theme';
import { resolveFonts } from './theme/resolveFonts';
import type { UIContextValue } from './types';
import { UIContext } from './UIContext';

export function UIProvider({ children }: PropsWithChildren) {
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
}
