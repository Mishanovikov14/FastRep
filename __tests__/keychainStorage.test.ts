import * as Keychain from 'react-native-keychain';

import { KeychainStorage } from '@/libs/storage/KeychainStorage';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
  },
  STORAGE_TYPE: {
    AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth',
  },
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

describe('KeychainStorage', () => {
  let storage: KeychainStorage;

  beforeEach(() => {
    storage = new KeychainStorage();
    jest.clearAllMocks();
    jest.mocked(Keychain.resetGenericPassword).mockResolvedValue(true);
    jest.mocked(Keychain.setGenericPassword).mockResolvedValue({
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
  });

  it('stores and restores the access and refresh tokens together', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      password: JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      username: 'fastrep',
    });

    await storage.saveTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const tokens = await storage.getTokens();

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'fastrep',
      JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      {
        accessible: 'WhenUnlockedThisDeviceOnly',
        service: 'com.fastrep.auth.tokens',
      },
    );
    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('clears the authentication token service', async () => {
    await storage.clearTokens();

    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.fastrep.auth.tokens',
    });
  });

  it('returns null without clearing when the token service has no credentials', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue(false);

    await expect(storage.getTokens()).resolves.toBeNull();
    expect(Keychain.resetGenericPassword).not.toHaveBeenCalled();
  });

  it('clears malformed JSON from the token service', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      password: '{malformed',
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      username: 'fastrep',
    });

    await expect(storage.getTokens()).resolves.toBeNull();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.fastrep.auth.tokens',
    });
  });

  it.each([
    {
      accessToken: 'access-token',
    },
    {
      refreshToken: 'refresh-token',
    },
    {
      accessToken: '',
      refreshToken: 'refresh-token',
    },
    {
      accessToken: 'access-token',
      refreshToken: '',
    },
  ])('clears incomplete or empty token data: %p', async (storedTokens) => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      password: JSON.stringify(storedTokens),
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      username: 'fastrep',
    });

    await expect(storage.getTokens()).resolves.toBeNull();
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
  });

  it('replaces the stored JSON pair when tokens rotate', async () => {
    await storage.saveTokens({
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
    });
    await storage.saveTokens({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(2);
    expect(Keychain.setGenericPassword).toHaveBeenLastCalledWith(
      'fastrep',
      JSON.stringify({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
      {
        accessible: 'WhenUnlockedThisDeviceOnly',
        service: 'com.fastrep.auth.tokens',
      },
    );
  });

  it('rejects a conditional write from a stale token snapshot', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      password: JSON.stringify({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      }),
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      username: 'fastrep',
    });

    const snapshot = await storage.getTokenSnapshot();

    await storage.clearTokens();

    await expect(
      storage.saveTokensIfCurrent(snapshot, {
        accessToken: 'rotated-access-token',
        refreshToken: 'rotated-refresh-token',
      }),
    ).resolves.toBe(false);
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('rejects a conditional clear after a newer login was queued', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue(false);
    const loggedOutSnapshot = await storage.getTokenSnapshot();

    await storage.saveTokens({
      accessToken: 'login-access-token',
      refreshToken: 'login-refresh-token',
    });

    await expect(storage.clearTokensIfCurrent(loggedOutSnapshot)).resolves.toBe(false);
    expect(Keychain.resetGenericPassword).not.toHaveBeenCalled();
  });

  it('clears tokens when the supplied snapshot is still current', async () => {
    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      password: JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      username: 'fastrep',
    });
    const snapshot = await storage.getTokenSnapshot();

    await expect(storage.clearTokensIfCurrent(snapshot)).resolves.toBe(true);
    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
  });

  it('serializes logout and login so a stale refresh cannot overwrite the login', async () => {
    let finishClear: (() => void) | undefined;
    const pendingClear = new Promise<void>((resolve) => {
      finishClear = resolve;
    });

    jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
      password: JSON.stringify({
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      }),
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      username: 'fastrep',
    });
    jest.mocked(Keychain.resetGenericPassword).mockImplementation(async () => {
      await pendingClear;

      return true;
    });

    const refreshSnapshot = await storage.getTokenSnapshot();
    const logout = storage.clearTokens();
    const login = storage.saveTokens({
      accessToken: 'login-access-token',
      refreshToken: 'login-refresh-token',
    });
    const staleRefresh = storage.saveTokensIfCurrent(refreshSnapshot, {
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    await expect(staleRefresh).resolves.toBe(false);
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();

    finishClear?.();
    await Promise.all([logout, login]);

    expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
    expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'fastrep',
      JSON.stringify({
        accessToken: 'login-access-token',
        refreshToken: 'login-refresh-token',
      }),
      {
        accessible: 'WhenUnlockedThisDeviceOnly',
        service: 'com.fastrep.auth.tokens',
      },
    );
  });

  it('retries a snapshot read when a queued mutation changes its version', async () => {
    let finishFirstRead: (() => void) | undefined;
    const pendingFirstRead = new Promise<void>((resolve) => {
      finishFirstRead = resolve;
    });

    jest
      .mocked(Keychain.getGenericPassword)
      .mockImplementationOnce(async () => {
        await pendingFirstRead;

        return {
          password: JSON.stringify({
            accessToken: 'old-access-token',
            refreshToken: 'old-refresh-token',
          }),
          service: 'com.fastrep.auth.tokens',
          storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
          username: 'fastrep',
        };
      })
      .mockResolvedValueOnce({
        password: JSON.stringify({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
        service: 'com.fastrep.auth.tokens',
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        username: 'fastrep',
      });

    const snapshotPromise = storage.getTokenSnapshot();

    await Promise.resolve();

    const save = storage.saveTokens({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    finishFirstRead?.();

    await save;

    await expect(snapshotPromise).resolves.toEqual({
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
      version: 1,
    });
    expect(Keychain.getGenericPassword).toHaveBeenCalledTimes(2);
  });
});
