import type { IRequesterAuthState } from '@/libs/requester/IRequester';
import type { IResponse } from '@/libs/requester/IResponse';
import type { ITokenSnapshot } from '@/libs/storage/types';
import { createTokenRefreshService } from '@/modules/auth/services/tokenRefreshService';
import type { ITokenPair } from '@/types/auth';

jest.mock('@/libs/requester/requester', () => ({
  configureRequesterAuth: jest.fn(),
}));

jest.mock('@/libs/storage/KeychainStorage', () => ({
  keychainStorage: {
    getTokenSnapshot: jest.fn(),
    saveTokensIfCurrent: jest.fn(),
  },
}));

jest.mock('@/modules/auth/API/authApi', () => ({
  refresh: jest.fn(),
}));

jest.mock('@/modules/auth/services/authStateService', () => ({
  clearAuthSession: jest.fn(),
  clearAuthSessionIfCurrent: jest.fn(),
}));

interface IDeferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

const createDeferred = <T>(): IDeferred<T> => {
  let onResolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    onResolve = resolve;
  });

  return {
    promise,
    resolve: onResolve,
  };
};

const currentTokens: ITokenPair = {
  accessToken: 'expired-access-token',
  refreshToken: 'current-refresh-token',
};

const rotatedTokens: ITokenPair = {
  accessToken: 'rotated-access-token',
  refreshToken: 'rotated-refresh-token',
};

const initialSnapshot: ITokenSnapshot = {
  tokens: currentTokens,
  version: 7,
};

const failedAuthState: IRequesterAuthState = {
  accessToken: currentTokens.accessToken,
  version: initialSnapshot.version,
};

const successfulRefresh: IResponse<ITokenPair> = {
  data: rotatedTokens,
  isError: false,
  message: '',
};

const createDependencies = () => {
  let snapshot: ITokenSnapshot = initialSnapshot;
  const clearSession = jest
    .fn<Promise<boolean>, [ITokenSnapshot]>()
    .mockResolvedValue(true);
  const getTokenSnapshot = jest.fn(async () => snapshot);
  const onSessionExpired = jest.fn();
  const refreshTokens = jest.fn<Promise<IResponse<ITokenPair>>, [string]>();
  const saveTokensIfCurrent = jest.fn(
    async (expectedSnapshot: ITokenSnapshot, tokens: ITokenPair) => {
      if (expectedSnapshot.version !== snapshot.version) {
        return false;
      }

      snapshot = {
        tokens,
        version: snapshot.version + 1,
      };

      return true;
    },
  );

  return {
    clearSession,
    getTokenSnapshot,
    onSessionExpired,
    refreshTokens,
    saveTokensIfCurrent,
    setSnapshot: (nextSnapshot: ITokenSnapshot) => {
      snapshot = nextSnapshot;
    },
  };
};

describe('createTokenRefreshService', () => {
  it('uses one refresh flight and saves one rotated pair for three callers', async () => {
    const dependencies = createDependencies();
    const deferredRefresh = createDeferred<IResponse<ITokenPair>>();
    dependencies.refreshTokens.mockReturnValue(deferredRefresh.promise);
    const service = createTokenRefreshService(dependencies);

    const firstRefresh = service.refreshTokenPair({ expectedAuthState: failedAuthState });
    const secondRefresh = service.refreshTokenPair({ expectedAuthState: failedAuthState });
    const thirdRefresh = service.refreshTokenPair({ expectedAuthState: failedAuthState });

    deferredRefresh.resolve(successfulRefresh);

    await expect(Promise.all([firstRefresh, secondRefresh, thirdRefresh])).resolves.toEqual([
      rotatedTokens,
      rotatedTokens,
      rotatedTokens,
    ]);
    expect(dependencies.refreshTokens).toHaveBeenCalledTimes(1);
    expect(dependencies.refreshTokens).toHaveBeenCalledWith(currentTokens.refreshToken);
    expect(dependencies.saveTokensIfCurrent).toHaveBeenCalledTimes(1);
    expect(dependencies.saveTokensIfCurrent).toHaveBeenCalledWith(
      initialSnapshot,
      rotatedTokens,
    );
    expect(dependencies.clearSession).not.toHaveBeenCalled();
  });

  it('reuses the completed rotation for a late 401 without refreshing again', async () => {
    const dependencies = createDependencies();
    const sameAccessRotatedTokens: ITokenPair = {
      accessToken: currentTokens.accessToken,
      refreshToken: 'rotated-refresh-token',
    };
    dependencies.refreshTokens.mockResolvedValue({
      data: sameAccessRotatedTokens,
      isError: false,
      message: '',
    });
    const service = createTokenRefreshService(dependencies);

    await expect(
      service.refreshTokenPair({ expectedAuthState: failedAuthState }),
    ).resolves.toEqual(sameAccessRotatedTokens);
    await expect(
      service.refreshTokenPair({ expectedAuthState: failedAuthState }),
    ).resolves.toEqual(sameAccessRotatedTokens);

    expect(dependencies.refreshTokens).toHaveBeenCalledTimes(1);
    expect(dependencies.saveTokensIfCurrent).toHaveBeenCalledTimes(1);
    expect(dependencies.clearSession).not.toHaveBeenCalled();
  });

  it('clears the session once when a shared refresh flight is rejected as invalid', async () => {
    const dependencies = createDependencies();
    dependencies.refreshTokens.mockResolvedValue({
      isError: true,
      message: 'Refresh token is expired',
      status: 401,
    });
    const service = createTokenRefreshService(dependencies);

    const results = await Promise.allSettled([
      service.refreshTokenPair({
        expectedAuthState: failedAuthState,
        notifySessionExpired: true,
      }),
      service.refreshTokenPair({
        expectedAuthState: failedAuthState,
        notifySessionExpired: true,
      }),
      service.refreshTokenPair({
        expectedAuthState: failedAuthState,
        notifySessionExpired: true,
      }),
    ]);

    expect(results.every(({ status }) => status === 'rejected')).toBe(true);
    expect(dependencies.refreshTokens).toHaveBeenCalledTimes(1);
    expect(dependencies.saveTokensIfCurrent).not.toHaveBeenCalled();
    expect(dependencies.clearSession).toHaveBeenCalledTimes(1);
    expect(dependencies.clearSession).toHaveBeenCalledWith(initialSnapshot);
    expect(dependencies.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('clears a still-current session snapshot that has no token pair', async () => {
    const dependencies = createDependencies();
    const missingSnapshot: ITokenSnapshot = {
      tokens: null,
      version: initialSnapshot.version,
    };
    dependencies.setSnapshot(missingSnapshot);
    const service = createTokenRefreshService(dependencies);

    await expect(
      service.refreshTokenPair({
        expectedAuthState: {
          accessToken: null,
          version: missingSnapshot.version,
        },
        notifySessionExpired: true,
      }),
    ).rejects.toThrow('Refresh token is unavailable.');

    expect(dependencies.refreshTokens).not.toHaveBeenCalled();
    expect(dependencies.clearSession).toHaveBeenCalledWith(missingSnapshot);
    expect(dependencies.onSessionExpired).not.toHaveBeenCalled();
  });

  it('does not reset state or notify when conditional cleanup loses to a newer login', async () => {
    const dependencies = createDependencies();
    dependencies.clearSession.mockResolvedValue(false);
    dependencies.refreshTokens.mockResolvedValue({
      isError: true,
      message: 'Refresh token is expired',
      status: 401,
    });
    const service = createTokenRefreshService(dependencies);

    await expect(
      service.refreshTokenPair({
        expectedAuthState: failedAuthState,
        notifySessionExpired: true,
      }),
    ).rejects.toThrow('Refresh token is expired');

    expect(dependencies.clearSession).toHaveBeenCalledTimes(1);
    expect(dependencies.onSessionExpired).not.toHaveBeenCalled();
  });

  it.each([
    {
      isError: true,
      message: 'Network unavailable',
      type: 'network_error',
    },
    {
      isError: true,
      message: 'Request timed out',
      type: 'timeout_error',
    },
    {
      isError: true,
      message: 'Service unavailable',
      status: 503,
      type: 'server_error',
    },
  ] as const)('preserves the session after a transient refresh failure: %p', async (failure) => {
    const dependencies = createDependencies();
    dependencies.refreshTokens.mockResolvedValue(failure);
    const service = createTokenRefreshService(dependencies);

    await expect(
      service.refreshTokenPair({
        expectedAuthState: failedAuthState,
        notifySessionExpired: true,
      }),
    ).rejects.toThrow(failure.message);
    expect(dependencies.clearSession).not.toHaveBeenCalled();
    expect(dependencies.onSessionExpired).not.toHaveBeenCalled();
  });

  it('does not save or clear when an older refresh completes after the session changed', async () => {
    const newerSession: ITokenPair = {
      accessToken: 'newer-access-token',
      refreshToken: 'newer-refresh-token',
    };
    const dependencies = createDependencies();
    const deferredRefresh = createDeferred<IResponse<ITokenPair>>();
    dependencies.refreshTokens.mockReturnValue(deferredRefresh.promise);
    const service = createTokenRefreshService(dependencies);
    const pendingRefresh = service.refreshTokenPair({
      expectedAuthState: failedAuthState,
    });

    await Promise.resolve();
    dependencies.setSnapshot({
      tokens: newerSession,
      version: initialSnapshot.version + 1,
    });
    deferredRefresh.resolve(successfulRefresh);

    await expect(pendingRefresh).rejects.toThrow(
      'The authentication session changed during refresh.',
    );
    expect(dependencies.saveTokensIfCurrent).toHaveBeenCalledTimes(1);
    expect(dependencies.clearSession).not.toHaveBeenCalled();
  });

  it('does not clear a newer login when the old refresh is rejected as invalid', async () => {
    const newerSession: ITokenPair = {
      accessToken: 'newer-access-token',
      refreshToken: 'newer-refresh-token',
    };
    const dependencies = createDependencies();
    const deferredRefresh = createDeferred<IResponse<ITokenPair>>();
    dependencies.refreshTokens.mockReturnValue(deferredRefresh.promise);
    const service = createTokenRefreshService(dependencies);
    const pendingRefresh = service.refreshTokenPair({
      expectedAuthState: failedAuthState,
      notifySessionExpired: true,
    });

    await Promise.resolve();
    dependencies.setSnapshot({
      tokens: newerSession,
      version: initialSnapshot.version + 1,
    });
    deferredRefresh.resolve({
      isError: true,
      message: 'Old refresh token is invalid',
      status: 401,
    });

    await expect(pendingRefresh).rejects.toThrow('Old refresh token is invalid');
    expect(dependencies.clearSession).not.toHaveBeenCalled();
    expect(dependencies.onSessionExpired).not.toHaveBeenCalled();
  });

  it('does not refresh or clear for a delayed 401 from an older account session', async () => {
    const dependencies = createDependencies();
    dependencies.setSnapshot({
      tokens: {
        accessToken: 'new-account-access-token',
        refreshToken: 'new-account-refresh-token',
      },
      version: initialSnapshot.version + 1,
    });
    const service = createTokenRefreshService(dependencies);

    await expect(
      service.refreshTokenPair({ expectedAuthState: failedAuthState }),
    ).rejects.toThrow('The authentication session changed during refresh.');
    expect(dependencies.refreshTokens).not.toHaveBeenCalled();
    expect(dependencies.saveTokensIfCurrent).not.toHaveBeenCalled();
    expect(dependencies.clearSession).not.toHaveBeenCalled();
  });
});
