import { normalizeLanguage, resolveLanguage } from '@/localization/languageResolver';

describe('languageResolver', () => {
  it('uses a valid stored language before device locales', () => {
    expect(resolveLanguage('de', [{ languageTag: 'fr-FR' }])).toBe('de');
  });

  it.each([
    ['en-US', 'en'],
    ['fr-FR', 'fr'],
    ['es-ES', 'es'],
    ['uk-UA', 'uk'],
    ['de-DE', 'de'],
  ] as const)('normalizes %s to %s', (languageTag, expectedLanguage) => {
    expect(normalizeLanguage({ languageTag })).toBe(expectedLanguage);
  });

  it('falls back to English for unsupported locales', () => {
    expect(resolveLanguage(null, [{ languageTag: 'pl-PL' }])).toBe('en');
  });

  it('ignores an invalid stored value', () => {
    expect(resolveLanguage('invalid', [{ languageTag: 'uk-UA' }])).toBe('uk');
  });
});
