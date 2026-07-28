import * as Keychain from 'react-native-keychain';

import type { ITokenPair } from '@/entities/user/types/auth';
import type { ITokenSnapshot } from '@/entities/user/types/session';

const TOKEN_SERVICE = 'com.fastrep.auth.tokens';
const TOKEN_USERNAME = 'fastrep';

type TokenReadResult =
  | {
      status: 'empty' | 'invalid';
      tokens: null;
    }
  | {
      status: 'valid';
      tokens: ITokenPair;
    };

const isTokenPair = (value: unknown): value is ITokenPair => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const tokens = value as Partial<ITokenPair>;

  return (
    typeof tokens.accessToken === 'string' &&
    tokens.accessToken.length > 0 &&
    typeof tokens.refreshToken === 'string' &&
    tokens.refreshToken.length > 0
  );
};

export class UserTokenStorage {
  private mutationQueue: Promise<void> = Promise.resolve();

  private mutationVersion = 0;

  async clearTokens(): Promise<void> {
    const mutation = this.enqueueMutation(async () => {
      await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
    });

    await mutation.completion;
  }

  async clearTokensIfCurrent(snapshot: ITokenSnapshot): Promise<boolean> {
    if (snapshot.version !== this.mutationVersion) {
      return false;
    }

    const mutation = this.enqueueMutation(async () => {
      await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
    });

    await mutation.completion;

    return true;
  }

  async getTokens(): Promise<ITokenPair | null> {
    const snapshot = await this.getTokenSnapshot();

    return snapshot.tokens;
  }

  async getTokenSnapshot(): Promise<ITokenSnapshot> {
    while (true) {
      const versionBeforeRead = this.mutationVersion;

      await this.mutationQueue;

      if (versionBeforeRead !== this.mutationVersion) {
        continue;
      }

      const result = await this.readTokens();

      if (versionBeforeRead !== this.mutationVersion) {
        continue;
      }

      if (result.status !== 'invalid') {
        return {
          tokens: result.tokens,
          version: versionBeforeRead,
        };
      }

      const cleanup = this.enqueueMutation(async () => {
        await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
      });

      await cleanup.completion;

      if (cleanup.version === this.mutationVersion) {
        return {
          tokens: null,
          version: cleanup.version,
        };
      }
    }
  }

  async saveTokens(tokens: ITokenPair): Promise<void> {
    const serializedTokens = this.serializeTokens(tokens);
    const mutation = this.enqueueMutation(() => this.writeTokens(serializedTokens));

    await mutation.completion;
  }

  async saveTokensIfCurrent(snapshot: ITokenSnapshot, tokens: ITokenPair): Promise<boolean> {
    if (snapshot.version !== this.mutationVersion) {
      return false;
    }

    const serializedTokens = this.serializeTokens(tokens);
    const mutation = this.enqueueMutation(() => this.writeTokens(serializedTokens));

    await mutation.completion;

    return true;
  }

  private enqueueMutation(mutation: () => Promise<void>): {
    completion: Promise<void>;
    version: number;
  } {
    this.mutationVersion += 1;

    const completion = this.mutationQueue.then(mutation);

    this.mutationQueue = completion.catch(() => undefined);

    return {
      completion,
      version: this.mutationVersion,
    };
  }

  private async readTokens(): Promise<TokenReadResult> {
    const credentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });

    if (!credentials) {
      return {
        status: 'empty',
        tokens: null,
      };
    }

    try {
      const tokens: unknown = JSON.parse(credentials.password);

      if (isTokenPair(tokens)) {
        return {
          status: 'valid',
          tokens,
        };
      }
    } catch {
      // Invalid secure storage data is reported below.
    }

    return {
      status: 'invalid',
      tokens: null,
    };
  }

  private serializeTokens(tokens: ITokenPair): string {
    if (!isTokenPair(tokens)) {
      throw new Error('Authentication tokens must be a complete non-empty pair.');
    }

    return JSON.stringify(tokens);
  }

  private async writeTokens(serializedTokens: string): Promise<void> {
    const result = await Keychain.setGenericPassword(TOKEN_USERNAME, serializedTokens, {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      service: TOKEN_SERVICE,
    });

    if (!result) {
      throw new Error('Unable to securely store authentication tokens.');
    }
  }
}

export const userTokenStorage = new UserTokenStorage();
