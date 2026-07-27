import { storage, storageKeys } from '@/libs/storage';

import type { SupportedLanguage } from './types';

export const getStoredLanguage = (): unknown => {
  return storage.get<unknown>(storageKeys.APP_LANGUAGE);
};

export const persistLanguage = (language: SupportedLanguage): boolean => {
  return storage.set(storageKeys.APP_LANGUAGE, language);
};
