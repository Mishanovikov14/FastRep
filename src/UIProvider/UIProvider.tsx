import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SupportedLanguage } from '@/localization';
import { DEFAULT_LANGUAGE, i18n, initializeLocalization, persistLanguage } from '@/localization';
import { radius, spacing } from '@/theme';
import { Loader } from '@/UIKit/Loader';

import type { LanguageOption } from './localization/types';
import { colors, fontFamilies, fonts, systemFonts } from './theme';
import type { UIContextValue } from './types';
import { UIContext } from './UIContext';

const languages: readonly LanguageOption[] = [
  { code: 'en', translationKey: 'languages.english' },
  { code: 'fr', translationKey: 'languages.french' },
  { code: 'es', translationKey: 'languages.spanish' },
  { code: 'uk', translationKey: 'languages.ukrainian' },
  { code: 'de', translationKey: 'languages.german' },
];

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

  const resolvedFonts = useMemo(() => (language === 'uk' ? systemFonts : fonts), [language]);

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

  return (
    <UIContext.Provider value={value}>
      {isInitialized ? children : <Loader fullscreen />}
    </UIContext.Provider>
  );
}
