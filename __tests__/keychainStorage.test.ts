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
  const storage = new KeychainStorage();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores and restores the access and refresh tokens together', async () => {
    jest.mocked(Keychain.setGenericPassword).mockResolvedValue({
      service: 'com.fastrep.auth.tokens',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
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
    jest.mocked(Keychain.resetGenericPassword).mockResolvedValue(true);

    await storage.clearTokens();

    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.fastrep.auth.tokens',
    });
  });
});
