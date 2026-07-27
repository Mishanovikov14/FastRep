import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { getMeWithoutRefresh } from '@/modules/auth/API/authApi';
import type { SessionRestoreResult } from '@/types/auth';

import { clearAuthSession } from './authStateService';
import {
  getTokenRefreshErrorDetails,
  isInvalidTokenRefreshError,
  refreshTokenPair,
} from './tokenRefreshService';

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

export const restoreAuthSession = async (): Promise<SessionRestoreResult> => {
  try {
    const tokens = await keychainStorage.getTokens();

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
      await clearAuthSession();

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
