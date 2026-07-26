import { storage, storageKeys } from '@/libs/storage';

import type { SupportedLanguage } from './languages';

export function getStoredLanguage(): unknown {
  return storage.get<unknown>(storageKeys.APP_LANGUAGE);
}

export function persistLanguage(language: SupportedLanguage): boolean {
  return storage.set(storageKeys.APP_LANGUAGE, language);
}
