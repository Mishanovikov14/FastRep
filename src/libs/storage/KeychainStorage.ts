import * as Keychain from 'react-native-keychain';

import type { AuthTokens } from './types';

const TOKEN_SERVICE = 'com.fastrep.auth.tokens';
const TOKEN_USERNAME = 'fastrep';

const isAuthTokens = (value: unknown): value is AuthTokens => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const tokens = value as Partial<AuthTokens>;

  return typeof tokens.accessToken === 'string' && typeof tokens.refreshToken === 'string';
};

export class KeychainStorage {
  async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
  }

  async getTokens(): Promise<AuthTokens | null> {
    const credentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });

    if (!credentials) {
      return null;
    }

    try {
      const tokens: unknown = JSON.parse(credentials.password);

      return isAuthTokens(tokens) ? tokens : null;
    } catch {
      return null;
    }
  }

  async saveTokens(tokens: AuthTokens): Promise<void> {
    const result = await Keychain.setGenericPassword(TOKEN_USERNAME, JSON.stringify(tokens), {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      service: TOKEN_SERVICE,
    });

    if (!result) {
      throw new Error('Unable to securely store authentication tokens.');
    }
  }
}

export const keychainStorage = new KeychainStorage();
