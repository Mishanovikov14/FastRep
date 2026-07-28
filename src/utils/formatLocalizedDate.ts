import dayjs from 'dayjs';
import 'dayjs/locale/de';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/uk';

import type { SupportedLanguage } from '@/localization/types';

export const formatLocalizedDate = (value: string, language: SupportedLanguage): string => {
  const date = dayjs(value);

  if (!date.isValid()) {
    return value;
  }

  return date.locale(language).format('D MMM YYYY, HH:mm');
};
