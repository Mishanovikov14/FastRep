import { de } from '@/localization/resources/de';
import { en } from '@/localization/resources/en';
import { es } from '@/localization/resources/es';
import { fr } from '@/localization/resources/fr';
import { uk } from '@/localization/resources/uk';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const collectStringEntries = (
  value: unknown,
  prefix = '',
): Array<{ key: string; value: string }> => {
  if (typeof value === 'string') {
    return [{ key: prefix, value }];
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nestedKey = prefix ? `${prefix}.${key}` : key;

    return collectStringEntries(nestedValue, nestedKey);
  });
};

describe('localization resources', () => {
  const resources = { de, en, es, fr, uk };
  const englishKeys = collectStringEntries(en)
    .map(({ key }) => key)
    .sort();

  it.each(Object.entries(resources))('%s matches the English resource structure', (_, resource) => {
    const keys = collectStringEntries(resource)
      .map(({ key }) => key)
      .sort();

    expect(keys).toEqual(englishKeys);
  });

  it.each(Object.entries(resources))('%s contains no empty visible strings', (_, resource) => {
    const emptyEntries = collectStringEntries(resource).filter(
      ({ value }) => value.trim().length === 0,
    );

    expect(emptyEntries).toEqual([]);
  });
});
