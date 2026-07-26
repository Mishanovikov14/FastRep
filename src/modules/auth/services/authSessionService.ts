import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { getMeWithoutRefresh } from '@/modules/auth/API/authApi';
import type { SessionRestoreResult } from '@/types/auth';

import { clearAuthSession } from './authStateService';
import { refreshTokenPair } from './tokenRefreshService';

export const restoreAuthSession = async (): Promise<SessionRestoreResult> => {
  try {
    const tokens = await keychainStorage.getTokens();

    if (!tokens) {
      return { isAuthorized: false };
    }

    const response = await getMeWithoutRefresh();

    if (!response.isError && response.data) {
      return {
        isAuthorized: true,
        user: response.data,
      };
    }

    if (response.status !== 401) {
      return { isAuthorized: false };
    }

    try {
      await refreshTokenPair();
    } catch {
      return { isAuthorized: false };
    }

    const retryResponse = await getMeWithoutRefresh();

    if (!retryResponse.isError && retryResponse.data) {
      return {
        isAuthorized: true,
        user: retryResponse.data,
      };
    }

    if (retryResponse.status === 401) {
      await clearAuthSession();
    }

    return { isAuthorized: false };
  } catch (error: unknown) {
    console.error('Unexpected session restoration failure', error);

    return { isAuthorized: false };
  }
};
