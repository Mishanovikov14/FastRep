import { getMeWithoutRefresh } from '@/entities/user/API/userApi';
import type { SessionRestoreResult } from '@/entities/user/types/session';

import {
  getTokenRefreshErrorDetails,
  isInvalidTokenRefreshError,
  refreshTokenPair,
} from './tokenRefreshService';
import { clearUserSession } from './userStateService';
import { userTokenStorage } from './userTokenStorage';

const getTemporaryErrorResult = (
  message?: string,
  type?: string,
  statusCode?: number,
): SessionRestoreResult => {
  return {
    message,
    status: 'temporary_error',
    statusCode,
    type,
  };
};

export const restoreUserSession = async (): Promise<SessionRestoreResult> => {
  try {
    const tokens = await userTokenStorage.getTokens();

    if (!tokens) {
      return { status: 'unauthorized' };
    }

    const response = await getMeWithoutRefresh();

    if (!response.isError && response.data) {
      return {
        status: 'authorized',
        user: response.data,
      };
    }

    if (response.status !== 401) {
      return getTemporaryErrorResult(
        response.message,
        response.type,
        response.status,
      );
    }

    try {
      await refreshTokenPair();
    } catch (error: unknown) {
      if (isInvalidTokenRefreshError(error)) {
        return { status: 'unauthorized' };
      }

      const details = getTokenRefreshErrorDetails(error);

      return getTemporaryErrorResult(
        details.message,
        details.type,
        details.statusCode,
      );
    }

    const retryResponse = await getMeWithoutRefresh();

    if (!retryResponse.isError && retryResponse.data) {
      return {
        status: 'authorized',
        user: retryResponse.data,
      };
    }

    if (retryResponse.status === 401) {
      await clearUserSession();

      return { status: 'unauthorized' };
    }

    return getTemporaryErrorResult(
      retryResponse.message,
      retryResponse.type,
      retryResponse.status,
    );
  } catch (error: unknown) {
    console.error('Unexpected session restoration failure', error);

    return getTemporaryErrorResult(
      error instanceof Error ? error.message : undefined,
      'unexpected_error',
    );
  }
};
