import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { getMeWithoutRefresh } from '@/modules/auth/API/authApi';
import { restoreAuthSession } from '@/modules/auth/services/authSessionService';
import { clearAuthSession } from '@/modules/auth/services/authStateService';
import { refreshTokenPair } from '@/modules/auth/services/tokenRefreshService';
import type { ITokenPair, IUser } from '@/types/auth';

jest.mock('@/libs/storage/KeychainStorage', () => ({
  keychainStorage: {
    getTokens: jest.fn(),
  },
}));

jest.mock('@/modules/auth/API/authApi', () => ({
  getMeWithoutRefresh: jest.fn(),
}));

jest.mock('@/modules/auth/services/authStateService', () => ({
  clearAuthSession: jest.fn(),
}));

jest.mock('@/modules/auth/services/tokenRefreshService', () => ({
  getTokenRefreshErrorDetails: jest.fn((error: unknown) => ({
    message: error instanceof Error ? error.message : undefined,
  })),
  isInvalidTokenRefreshError: jest.fn(
    (error: unknown) =>
      error instanceof Error &&
      'shouldClearSession' in error &&
      error.shouldClearSession === true,
  ),
  refreshTokenPair: jest.fn(),
}));

const tokens: ITokenPair = {
  accessToken: 'expired-access-token',
  refreshToken: 'current-refresh-token',
};

const rotatedTokens: ITokenPair = {
  accessToken: 'rotated-access-token',
  refreshToken: 'rotated-refresh-token',
};

const user: IUser = {
  createdAt: '2026-01-01T00:00:00.000Z',
  email: 'runner@fastrep.dev',
  fullName: 'Fast Runner',
  id: 'user-1',
  isPremium: true,
  language: 'en',
  photoUrl: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const unauthorizedResponse = {
  isError: true,
  message: 'Unauthorized',
  status: 401,
};

describe('restoreAuthSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(keychainStorage.getTokens).mockResolvedValue(tokens);
    jest.mocked(refreshTokenPair).mockResolvedValue(rotatedTokens);
    jest.mocked(clearAuthSession).mockResolvedValue();
  });

  it('returns an unauthorized result without a network request when no tokens exist', async () => {
    jest.mocked(keychainStorage.getTokens).mockResolvedValueOnce(null);

    await expect(restoreAuthSession()).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(getMeWithoutRefresh).not.toHaveBeenCalled();
    expect(refreshTokenPair).not.toHaveBeenCalled();
    expect(clearAuthSession).not.toHaveBeenCalled();
  });

  it('restores a user when the current access token is valid', async () => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce({
      data: user,
      isError: false,
      message: '',
    });

    await expect(restoreAuthSession()).resolves.toEqual({
      status: 'authorized',
      user,
    });
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(1);
    expect(refreshTokenPair).not.toHaveBeenCalled();
    expect(clearAuthSession).not.toHaveBeenCalled();
  });

  it('refreshes once and retries the user request once after a 401', async () => {
    jest
      .mocked(getMeWithoutRefresh)
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce({
        data: user,
        isError: false,
        message: '',
      });

    await expect(restoreAuthSession()).resolves.toEqual({
      status: 'authorized',
      user,
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(2);
    expect(clearAuthSession).not.toHaveBeenCalled();
  });

  it('returns unauthorized when refresh proves the session invalid', async () => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce(unauthorizedResponse);
    jest.mocked(refreshTokenPair).mockRejectedValueOnce(
      Object.assign(new Error('Refresh token is invalid'), {
        sessionSnapshot: {
          tokens,
          version: 1,
        },
        shouldClearSession: true,
      }),
    );

    await expect(restoreAuthSession()).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(1);
    expect(clearAuthSession).not.toHaveBeenCalled();
  });

  it('does not retry user restoration more than once and clears a repeated 401', async () => {
    jest
      .mocked(getMeWithoutRefresh)
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce(unauthorizedResponse);

    await expect(restoreAuthSession()).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(2);
    expect(clearAuthSession).toHaveBeenCalledTimes(1);
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
      message: 'Internal server error',
      status: 500,
    },
  ])('returns a temporary error after a transient initial /auth/me failure: %p', async (failure) => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce(failure);

    await expect(restoreAuthSession()).resolves.toEqual({
      message: failure.message,
      status: 'temporary_error',
      statusCode: failure.status,
      type: failure.type,
    });
    expect(refreshTokenPair).not.toHaveBeenCalled();
    expect(clearAuthSession).not.toHaveBeenCalled();
  });

  it('preserves the rotated pair when the retried /auth/me request has a transient failure', async () => {
    jest
      .mocked(getMeWithoutRefresh)
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce({
        isError: true,
        message: 'Service unavailable',
        status: 503,
      });

    await expect(restoreAuthSession()).resolves.toEqual({
      message: 'Service unavailable',
      status: 'temporary_error',
      statusCode: 503,
      type: undefined,
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(clearAuthSession).not.toHaveBeenCalled();
  });

  it('returns a temporary error when token refresh fails transiently', async () => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce(unauthorizedResponse);
    jest
      .mocked(refreshTokenPair)
      .mockRejectedValueOnce(new Error('Network connection is unavailable.'));

    await expect(restoreAuthSession()).resolves.toEqual({
      message: 'Network connection is unavailable.',
      status: 'temporary_error',
      statusCode: undefined,
      type: undefined,
    });
    expect(clearAuthSession).not.toHaveBeenCalled();
  });
});
