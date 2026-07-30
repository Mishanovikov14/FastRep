import { getMeWithoutRefresh } from '@/entities/user/API/userApi';
import { useUserStore } from '@/entities/user/model/userStore';
import type { IAuthenticationResponse } from '@/entities/user/types/auth';
import type { SessionRestoreResult } from '@/entities/user/types/session';
import { enforceAppEnvironmentForAuthenticatedUser } from '@/entities/environment/services/appEnvironmentService';

import { clearAuthenticatedResources } from './authenticatedResourcesService';
import { getTokenRefreshErrorDetails, isInvalidTokenRefreshError, refreshTokenPair } from './tokenRefreshService';
import { clearUserSession } from './userStateService';
import { userTokenStorage } from './userTokenStorage';

const getTemporaryErrorResult = (message?: string, type?: string, statusCode?: number): SessionRestoreResult => {
  return {
    message,
    status: 'temporary_error',
    statusCode,
    type,
  };
};

const clearInvalidEnvironmentSession = async (): Promise<void> => {
  try {
    await clearUserSession();
  } finally {
    await clearAuthenticatedResources();
  }
};

const resolveAuthenticatedUser = async (user: IAuthenticationResponse['user']): Promise<boolean> => {
  const isEnvironmentAllowed = enforceAppEnvironmentForAuthenticatedUser(user.email);

  if (!isEnvironmentAllowed) {
    await clearInvalidEnvironmentSession();
  }

  return isEnvironmentAllowed;
};

export const applyAuthenticationResponse = async (
  authentication: IAuthenticationResponse,
): Promise<'authenticated' | 'environment_reset'> => {
  if (!(await resolveAuthenticatedUser(authentication.user))) {
    return 'environment_reset';
  }

  await userTokenStorage.saveTokens({
    accessToken: authentication.accessToken,
    refreshToken: authentication.refreshToken,
  });
  useUserStore.getState().setUser(authentication.user);

  return 'authenticated';
};

export const restoreUserSession = async (): Promise<SessionRestoreResult> => {
  try {
    const tokens = await userTokenStorage.getTokens();

    if (!tokens) {
      return { status: 'unauthorized' };
    }

    const response = await getMeWithoutRefresh();

    if (!response.isError && response.data) {
      if (!(await resolveAuthenticatedUser(response.data))) {
        return { status: 'unauthorized' };
      }

      return {
        status: 'authorized',
        user: response.data,
      };
    }

    if (response.status !== 401) {
      return getTemporaryErrorResult(response.message, response.type, response.status);
    }

    try {
      await refreshTokenPair();
    } catch (error: unknown) {
      if (isInvalidTokenRefreshError(error)) {
        return { status: 'unauthorized' };
      }

      const details = getTokenRefreshErrorDetails(error);

      return getTemporaryErrorResult(details.message, details.type, details.statusCode);
    }

    const retryResponse = await getMeWithoutRefresh();

    if (!retryResponse.isError && retryResponse.data) {
      if (!(await resolveAuthenticatedUser(retryResponse.data))) {
        return { status: 'unauthorized' };
      }

      return {
        status: 'authorized',
        user: retryResponse.data,
      };
    }

    if (retryResponse.status === 401) {
      await clearUserSession();

      return { status: 'unauthorized' };
    }

    return getTemporaryErrorResult(retryResponse.message, retryResponse.type, retryResponse.status);
  } catch (error: unknown) {
    console.error('Unexpected session restoration failure', error);

    return getTemporaryErrorResult(error instanceof Error ? error.message : undefined, 'unexpected_error');
  }
};
