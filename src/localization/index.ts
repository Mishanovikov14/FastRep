export { i18n, initializeLocalization } from './i18n';
export type { LocaleCandidate } from './languageResolver';
export { normalizeLanguage, resolveAndPersistLanguage, resolveLanguage } from './languageResolver';
export type { SupportedLanguage } from './languages';
export { DEFAULT_LANGUAGE, isSupportedLanguage, supportedLanguages } from './languages';
export { getStoredLanguage, persistLanguage } from './storage';
