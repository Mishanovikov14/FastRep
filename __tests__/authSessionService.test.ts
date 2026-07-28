import { getMeWithoutRefresh } from '@/entities/user/API/userApi';
import { useUserStore } from '@/entities/user/model/userStore';
import { refreshTokenPair } from '@/entities/user/services/tokenRefreshService';
import { applyAuthenticationResponse, restoreUserSession } from '@/entities/user/services/userSessionService';
import { clearUserSession } from '@/entities/user/services/userStateService';
import { userTokenStorage } from '@/entities/user/services/userTokenStorage';
import type { ITokenPair } from '@/entities/user/types/auth';
import type { IUser } from '@/entities/user/types/user';

jest.mock('@/entities/user/services/userTokenStorage', () => ({
  userTokenStorage: {
    getTokens: jest.fn(),
    saveTokens: jest.fn(),
  },
}));

jest.mock('@/entities/user/API/userApi', () => ({
  getMeWithoutRefresh: jest.fn(),
}));

jest.mock('@/entities/user/services/userStateService', () => ({
  clearUserSession: jest.fn(),
}));

jest.mock('@/entities/user/services/tokenRefreshService', () => ({
  getTokenRefreshErrorDetails: jest.fn((error: unknown) => ({
    message: error instanceof Error ? error.message : undefined,
  })),
  isInvalidTokenRefreshError: jest.fn(
    (error: unknown) => error instanceof Error && 'shouldClearSession' in error && error.shouldClearSession === true,
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

describe('applyAuthenticationResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.getState().clearUser();
    jest.mocked(userTokenStorage.saveTokens).mockResolvedValue();
  });

  it('persists the Keychain token pair before authorizing the existing user store', async () => {
    await applyAuthenticationResponse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user,
    });

    expect(userTokenStorage.saveTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: true,
      user,
    });
  });
});

describe('restoreUserSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(userTokenStorage.getTokens).mockResolvedValue(tokens);
    jest.mocked(refreshTokenPair).mockResolvedValue(rotatedTokens);
    jest.mocked(clearUserSession).mockResolvedValue();
  });

  it('returns an unauthorized result without a network request when no tokens exist', async () => {
    jest.mocked(userTokenStorage.getTokens).mockResolvedValueOnce(null);

    await expect(restoreUserSession()).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(getMeWithoutRefresh).not.toHaveBeenCalled();
    expect(refreshTokenPair).not.toHaveBeenCalled();
    expect(clearUserSession).not.toHaveBeenCalled();
  });

  it('restores a user when the current access token is valid', async () => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce({
      data: user,
      isError: false,
      message: '',
    });

    await expect(restoreUserSession()).resolves.toEqual({
      status: 'authorized',
      user,
    });
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(1);
    expect(refreshTokenPair).not.toHaveBeenCalled();
    expect(clearUserSession).not.toHaveBeenCalled();
  });

  it('refreshes once and retries the user request once after a 401', async () => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce(unauthorizedResponse).mockResolvedValueOnce({
      data: user,
      isError: false,
      message: '',
    });

    await expect(restoreUserSession()).resolves.toEqual({
      status: 'authorized',
      user,
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(2);
    expect(clearUserSession).not.toHaveBeenCalled();
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

    await expect(restoreUserSession()).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(1);
    expect(clearUserSession).not.toHaveBeenCalled();
  });

  it('does not retry user restoration more than once and clears a repeated 401', async () => {
    jest
      .mocked(getMeWithoutRefresh)
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce(unauthorizedResponse);

    await expect(restoreUserSession()).resolves.toEqual({
      status: 'unauthorized',
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(getMeWithoutRefresh).toHaveBeenCalledTimes(2);
    expect(clearUserSession).toHaveBeenCalledTimes(1);
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

    await expect(restoreUserSession()).resolves.toEqual({
      message: failure.message,
      status: 'temporary_error',
      statusCode: failure.status,
      type: failure.type,
    });
    expect(refreshTokenPair).not.toHaveBeenCalled();
    expect(clearUserSession).not.toHaveBeenCalled();
  });

  it('preserves the rotated pair when the retried /auth/me request has a transient failure', async () => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce(unauthorizedResponse).mockResolvedValueOnce({
      isError: true,
      message: 'Service unavailable',
      status: 503,
    });

    await expect(restoreUserSession()).resolves.toEqual({
      message: 'Service unavailable',
      status: 'temporary_error',
      statusCode: 503,
      type: undefined,
    });
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(clearUserSession).not.toHaveBeenCalled();
  });

  it('returns a temporary error when token refresh fails transiently', async () => {
    jest.mocked(getMeWithoutRefresh).mockResolvedValueOnce(unauthorizedResponse);
    jest.mocked(refreshTokenPair).mockRejectedValueOnce(new Error('Network connection is unavailable.'));

    await expect(restoreUserSession()).resolves.toEqual({
      message: 'Network connection is unavailable.',
      status: 'temporary_error',
      statusCode: undefined,
      type: undefined,
    });
    expect(clearUserSession).not.toHaveBeenCalled();
  });
});
