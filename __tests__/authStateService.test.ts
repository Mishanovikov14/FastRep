import { useUserStore } from '@/entities/user/model/userStore';
import {
  clearUserSession,
  clearUserSessionIfCurrent,
} from '@/entities/user/services/userStateService';
import { userTokenStorage } from '@/entities/user/services/userTokenStorage';
import type { ITokenSnapshot } from '@/entities/user/types/session';
import type { IUser } from '@/entities/user/types/user';

jest.mock('@/entities/user/services/userTokenStorage', () => ({
  userTokenStorage: {
    clearTokens: jest.fn(),
    clearTokensIfCurrent: jest.fn(),
  },
}));

const user: IUser = {
  createdAt: '2026-07-26T10:00:00.000Z',
  email: 'alex@example.com',
  fullName: 'Alex Morgan',
  id: 'user-1',
  isPremium: false,
  language: 'en',
  photoUrl: null,
  updatedAt: '2026-07-26T10:00:00.000Z',
};

const snapshot: ITokenSnapshot = {
  tokens: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  },
  version: 4,
};

describe('clearUserSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user,
    });
  });

  it('clears Keychain and authenticated state', async () => {
    jest.mocked(userTokenStorage.clearTokens).mockResolvedValue();

    await clearUserSession();

    expect(userTokenStorage.clearTokens).toHaveBeenCalledTimes(1);
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });

  it('still clears authenticated state when Keychain reports an error', async () => {
    jest
      .mocked(userTokenStorage.clearTokens)
      .mockRejectedValue(new Error('Keychain unavailable'));

    await expect(clearUserSession()).rejects.toThrow('Keychain unavailable');

    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });

  it('clears state only when the conditional Keychain clear commits', async () => {
    jest.mocked(userTokenStorage.clearTokensIfCurrent).mockResolvedValue(true);

    await expect(clearUserSessionIfCurrent(snapshot)).resolves.toBe(true);

    expect(userTokenStorage.clearTokensIfCurrent).toHaveBeenCalledWith(snapshot);
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });

  it('preserves a newer store session when the conditional Keychain clear is stale', async () => {
    jest.mocked(userTokenStorage.clearTokensIfCurrent).mockResolvedValue(false);

    await expect(clearUserSessionIfCurrent(snapshot)).resolves.toBe(false);

    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: true,
      user,
    });
  });

  it('resets local state when an accepted conditional Keychain clear fails natively', async () => {
    jest
      .mocked(userTokenStorage.clearTokensIfCurrent)
      .mockRejectedValue(new Error('Keychain unavailable'));

    await expect(clearUserSessionIfCurrent(snapshot)).rejects.toThrow(
      'Keychain unavailable',
    );

    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });
});
