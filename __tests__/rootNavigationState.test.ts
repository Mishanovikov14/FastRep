import { getRootNavigationState } from '@/navigation/getRootNavigationState';

describe('getRootNavigationState', () => {
  it.each([
    [false, false, 'splash'],
    [true, false, 'splash'],
    [false, true, 'guest'],
    [true, true, 'app'],
  ] as const)(
    'selects %s authorization with %s restoration as %s',
    (isAuthorized, isSessionRestored, expectedState) => {
      expect(
        getRootNavigationState({
          isAuthorized,
          isSessionRestored,
        }),
      ).toBe(expectedState);
    },
  );
});
