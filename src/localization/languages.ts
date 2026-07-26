export const supportedLanguages = ['en', 'fr', 'es', 'uk', 'de'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    supportedLanguages.includes(value.toLowerCase() as SupportedLanguage)
  );
}
