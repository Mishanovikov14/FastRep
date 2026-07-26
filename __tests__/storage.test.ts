import { MMKVStorage } from '@/libs/storage';

describe('MMKVStorage', () => {
  const storage = new MMKVStorage();

  beforeEach(() => {
    storage.clearAll();
  });

  it.each([
    ['string', 'FastRep'],
    ['boolean', true],
    ['number', 42],
    ['array', ['one', 'two']],
    ['object', { enabled: true, retries: 2 }],
  ])('round-trips a %s value', (_type, value) => {
    expect(storage.set('test.value', value)).toBe(true);
    expect(storage.get('test.value')).toEqual(value);
  });

  it('returns null when a value does not exist', () => {
    expect(storage.get('missing')).toBeNull();
  });
});
