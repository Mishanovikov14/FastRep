import { queryClient } from '@/libs/query/QueryClient';
import { keychainStorage } from '@/libs/storage/KeychainStorage';
import type { ITokenSnapshot } from '@/libs/storage/types';
import {
  clearAuthSession,
  clearAuthSessionIfCurrent,
} from '@/modules/auth/services/authStateService';
import { useAuthStore } from '@/storage/authStore';
import type { IUser } from '@/types/auth';

jest.mock('@/libs/query/QueryClient', () => ({
  queryClient: {
    clear: jest.fn(),
  },
}));

jest.mock('@/libs/storage/KeychainStorage', () => ({
  keychainStorage: {
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

describe('clearAuthSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user,
    });
  });

  it('clears Keychain, query data, and authenticated state', async () => {
    jest.mocked(keychainStorage.clearTokens).mockResolvedValue();

    await clearAuthSession();

    expect(keychainStorage.clearTokens).toHaveBeenCalledTimes(1);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });

  it('still clears query data and authenticated state when Keychain reports an error', async () => {
    jest.mocked(keychainStorage.clearTokens).mockRejectedValue(new Error('Keychain unavailable'));

    await expect(clearAuthSession()).rejects.toThrow('Keychain unavailable');

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });

  it('clears state only when the conditional Keychain clear commits', async () => {
    jest.mocked(keychainStorage.clearTokensIfCurrent).mockResolvedValue(true);

    await expect(clearAuthSessionIfCurrent(snapshot)).resolves.toBe(true);

    expect(keychainStorage.clearTokensIfCurrent).toHaveBeenCalledWith(snapshot);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });

  it('preserves a newer store session when the conditional Keychain clear is stale', async () => {
    jest.mocked(keychainStorage.clearTokensIfCurrent).mockResolvedValue(false);

    await expect(clearAuthSessionIfCurrent(snapshot)).resolves.toBe(false);

    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      isAuthorized: true,
      user,
    });
  });

  it('resets local state when an accepted conditional Keychain clear fails natively', async () => {
    jest
      .mocked(keychainStorage.clearTokensIfCurrent)
      .mockRejectedValue(new Error('Keychain unavailable'));

    await expect(clearAuthSessionIfCurrent(snapshot)).rejects.toThrow(
      'Keychain unavailable',
    );

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });
});
