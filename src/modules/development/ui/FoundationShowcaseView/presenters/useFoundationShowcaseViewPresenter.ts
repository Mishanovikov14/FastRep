import { useCallback, useMemo } from 'react';
import Config from 'react-native-config';

import { toastService } from '@/libs/toast';

import type { IFontLanguageSample, IFontWeightSample, ILanguageControl, IPresenterInput } from '../types';

const fontWeightSamples: readonly IFontWeightSample[] = [
  { label: 'Regular — 400', weight: 'regular' },
  { label: 'Medium — 500', weight: 'medium' },
  { label: 'SemiBold — 600', weight: 'semibold' },
  { label: 'Bold — 700', weight: 'bold' },
];

const fontLanguageSamples: readonly IFontLanguageSample[] = [
  { code: 'en', label: 'English', text: 'Fast reports, clearly organized.' },
  { code: 'fr', label: 'French', text: 'Des rapports rapides et bien organisés.' },
  { code: 'es', label: 'Spanish', text: 'Informes rápidos y bien organizados.' },
  { code: 'uk', label: 'Ukrainian', text: 'Швидкі та добре організовані звіти.' },
  { code: 'de', label: 'German', text: 'Schnelle und gut organisierte Berichte.' },
];

export const useFoundationShowcaseViewPresenter = ({ language, languages, setLanguage, t }: IPresenterInput) => {
  const onPressNoop = useCallback(() => undefined, []);

  const onPressShowSuccess = useCallback(() => {
    toastService.showSuccess(String(t('showcase.successTitle')), String(t('showcase.successMessage')));
  }, [t]);

  const onPressShowError = useCallback(() => {
    toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
  }, [t]);

  const onPressShowInfo = useCallback(() => {
    toastService.showInfo(String(t('common.info')), String(t('common.info')));
  }, [t]);

  const onSelectLanguage = useCallback(
    async (nextLanguage: IFontLanguageSample['code']) => {
      try {
        await setLanguage(nextLanguage);
      } catch {
        toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
      }
    },
    [setLanguage, t],
  );

  const languageControls = useMemo<ILanguageControl[]>(
    () =>
      languages.map((option) => ({
        code: option.code,
        disabled: language === option.code,
        onPress: () => {
          onSelectLanguage(option.code);
        },
        title: String(t(option.translationKey)),
      })),
    [language, languages, onSelectLanguage, t],
  );

  return {
    apiUrl: Config.API_URL,
    fontLanguageSamples,
    fontWeightSamples,
    languageControls,
    onPressNoop,
    onPressShowError,
    onPressShowInfo,
    onPressShowSuccess,
  };
};
