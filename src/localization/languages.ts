import { supportedLanguages } from './config';
import type { SupportedLanguage } from './types';

export { supportedLanguages };

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const isSupportedLanguage = (value: unknown): value is SupportedLanguage => {
  return (
    typeof value === 'string' &&
    supportedLanguages.includes(value.toLowerCase() as SupportedLanguage)
  );
};
