import { refresh } from '@/entities/user/API/userApi';
import { isAppEnvironmentSwitching } from '@/entities/environment/services/appEnvironmentService';
import type { ITokenPair } from '@/entities/user/types/auth';
import type { ITokenSnapshot } from '@/entities/user/types/session';
import type { IRequesterAuthState } from '@/libs/requester/IRequester';
import type { IResponse } from '@/libs/requester/IResponse';
import { configureRequesterAuth } from '@/libs/requester/requester';
import { toastService } from '@/libs/toast/toastService';
import { i18n } from '@/localization/i18n';

import { clearUserSessionIfCurrent } from './userStateService';
import { userTokenStorage } from './userTokenStorage';

interface ITokenRefreshDependencies {
  clearSession(snapshot: ITokenSnapshot): Promise<boolean>;
  getTokenSnapshot(): Promise<ITokenSnapshot>;
  onSessionExpired?(): void;
  refreshTokens(refreshToken: string): Promise<IResponse<ITokenPair>>;
  saveTokensIfCurrent(snapshot: ITokenSnapshot, tokens: ITokenPair): Promise<boolean>;
}

interface IRefreshOptions {
  expectedAuthState?: IRequesterAuthState;
  notifySessionExpired?: boolean;
}

interface IRefreshOutcome {
  nextVersion: number;
  previousAccessToken: string;
  previousVersion: number;
  tokens: ITokenPair;
}

interface ITokenRefreshError extends Error {
  sessionSnapshot: ITokenSnapshot;
  shouldClearSession: boolean;
  statusCode?: number;
  type?: string;
}

const STALE_REFRESH_ERROR = new Error('The authentication session changed during refresh.');

const createTokenRefreshError = (
  message: string,
  shouldClearSession: boolean,
  sessionSnapshot: ITokenSnapshot,
  type?: string,
  statusCode?: number,
): ITokenRefreshError => {
  return Object.assign(new Error(message), {
    sessionSnapshot,
    shouldClearSession,
    statusCode,
    type,
  });
};

const isTokenRefreshError = (error: unknown): error is ITokenRefreshError => {
  return (
    error instanceof Error &&
    'sessionSnapshot' in error &&
    'shouldClearSession' in error &&
    typeof error.shouldClearSession === 'boolean'
  );
};

export const isInvalidTokenRefreshError = (error: unknown): boolean => {
  return isTokenRefreshError(error) && error.shouldClearSession;
};

export const getTokenRefreshErrorDetails = (
  error: unknown,
): {
  message?: string;
  statusCode?: number;
  type?: string;
} => {
  if (!isTokenRefreshError(error)) {
    return {
      message: error instanceof Error ? error.message : undefined,
    };
  }

  return {
    message: error.message,
    statusCode: error.statusCode,
    type: error.type,
  };
};

const isSameTokenPair = (left: ITokenPair | null, right: ITokenPair | null): boolean => {
  if (!left || !right) {
    return left === right;
  }

  return left.accessToken === right.accessToken && left.refreshToken === right.refreshToken;
};

const isInvalidRefreshResponse = (response: IResponse<ITokenPair>): boolean => {
  return response.status === 400 || response.status === 401 || response.status === 403;
};

export const createTokenRefreshService = ({
  clearSession,
  getTokenSnapshot,
  onSessionExpired,
  refreshTokens,
  saveTokensIfCurrent,
}: ITokenRefreshDependencies) => {
  let activeRefresh: Promise<IRefreshOutcome> | null = null;
  let lastSuccessfulRefresh: IRefreshOutcome | null = null;
  let shouldNotifySessionExpired = false;

  const performRefresh = async (expectedAuthState?: IRequesterAuthState): Promise<IRefreshOutcome> => {
    let snapshot: ITokenSnapshot;

    try {
      snapshot = await getTokenSnapshot();
    } catch {
      throw new Error('Unable to read the authentication session.');
    }

    if (expectedAuthState && snapshot.version !== expectedAuthState.version) {
      if (
        expectedAuthState.accessToken !== null &&
        lastSuccessfulRefresh?.previousVersion === expectedAuthState.version &&
        lastSuccessfulRefresh.previousAccessToken === expectedAuthState.accessToken &&
        lastSuccessfulRefresh.nextVersion === snapshot.version &&
        isSameTokenPair(snapshot.tokens, lastSuccessfulRefresh.tokens)
      ) {
        return lastSuccessfulRefresh;
      }

      throw STALE_REFRESH_ERROR;
    }

    if (!snapshot.tokens) {
      if (expectedAuthState?.accessToken) {
        throw STALE_REFRESH_ERROR;
      }

      throw createTokenRefreshError('Refresh token is unavailable.', true, snapshot);
    }

    if (expectedAuthState && snapshot.tokens.accessToken !== expectedAuthState.accessToken) {
      throw STALE_REFRESH_ERROR;
    }

    let response: IResponse<ITokenPair>;

    try {
      response = await refreshTokens(snapshot.tokens.refreshToken);
    } catch {
      throw createTokenRefreshError('Unable to refresh the authentication session.', false, snapshot);
    }

    if (response.isError || !response.data) {
      throw createTokenRefreshError(
        response.message || 'Unable to refresh the authentication session.',
        isInvalidRefreshResponse(response),
        snapshot,
        response.type,
        response.status,
      );
    }

    let wasSaved: boolean;

    try {
      wasSaved = await saveTokensIfCurrent(snapshot, response.data);
    } catch {
      throw createTokenRefreshError('Unable to save the refreshed authentication session.', true, snapshot);
    }

    if (!wasSaved) {
      throw STALE_REFRESH_ERROR;
    }

    let committedSnapshot: ITokenSnapshot;

    try {
      committedSnapshot = await getTokenSnapshot();
    } catch {
      throw createTokenRefreshError('Unable to verify the refreshed authentication session.', true, snapshot);
    }

    if (!isSameTokenPair(committedSnapshot.tokens, response.data)) {
      throw STALE_REFRESH_ERROR;
    }

    const outcome: IRefreshOutcome = {
      nextVersion: committedSnapshot.version,
      previousAccessToken: snapshot.tokens.accessToken,
      previousVersion: snapshot.version,
      tokens: response.data,
    };

    lastSuccessfulRefresh = outcome;

    return outcome;
  };

  const refreshTokenPair = ({
    expectedAuthState,
    notifySessionExpired = false,
  }: IRefreshOptions = {}): Promise<ITokenPair> => {
    shouldNotifySessionExpired ||= notifySessionExpired;

    if (!activeRefresh) {
      activeRefresh = performRefresh(expectedAuthState)
        .catch(async (error: unknown) => {
          if (isTokenRefreshError(error) && error.shouldClearSession) {
            let cleanupSnapshot: ITokenSnapshot | null = null;
            let shouldClear = false;
            let shouldNotify = false;

            try {
              const currentSnapshot = await getTokenSnapshot();

              if (!currentSnapshot.tokens) {
                cleanupSnapshot = currentSnapshot;
                shouldClear = true;
                shouldNotify = false;
              } else if (isSameTokenPair(currentSnapshot.tokens, error.sessionSnapshot.tokens)) {
                cleanupSnapshot = currentSnapshot;
                shouldClear = true;
                shouldNotify = true;
              }
            } catch (snapshotError: unknown) {
              console.error('Unable to verify the failed authentication session', snapshotError);
            }

            if (shouldClear && cleanupSnapshot) {
              let wasCleared = false;

              try {
                wasCleared = await clearSession(cleanupSnapshot);
              } catch (clearError: unknown) {
                console.error('Unable to clear the expired authentication session', clearError);

                if (shouldNotify && shouldNotifySessionExpired) {
                  onSessionExpired?.();
                }
              }

              if (wasCleared && shouldNotify && shouldNotifySessionExpired) {
                onSessionExpired?.();
              }
            }
          }

          throw error;
        })
        .finally(() => {
          activeRefresh = null;
          shouldNotifySessionExpired = false;
        });
    }

    return activeRefresh.then((outcome) => {
      if (
        expectedAuthState &&
        (outcome.previousVersion !== expectedAuthState.version ||
          outcome.previousAccessToken !== expectedAuthState.accessToken)
      ) {
        throw STALE_REFRESH_ERROR;
      }

      return outcome.tokens;
    });
  };

  return {
    refreshTokenPair,
  };
};

const tokenRefreshService = createTokenRefreshService({
  clearSession: clearUserSessionIfCurrent,
  getTokenSnapshot: () => userTokenStorage.getTokenSnapshot(),
  onSessionExpired: () => {
    toastService.showError(String(i18n.t('common.error')), String(i18n.t('auth.session.expired')));
  },
  refreshTokens: refresh,
  saveTokensIfCurrent: (snapshot, tokens) => userTokenStorage.saveTokensIfCurrent(snapshot, tokens),
});

let isRequesterConfigured = false;

export const initializeTokenRefreshService = (): void => {
  if (isRequesterConfigured) {
    return;
  }

  isRequesterConfigured = true;
  configureRequesterAuth({
    getAuthState: async () => {
      if (isAppEnvironmentSwitching()) {
        return null;
      }

      const snapshot = await userTokenStorage.getTokenSnapshot();

      return {
        accessToken: snapshot.tokens?.accessToken ?? null,
        version: snapshot.version,
      };
    },
    refreshAuthState: async (failedAuthState) => {
      if (!failedAuthState || isAppEnvironmentSwitching()) {
        return null;
      }

      const tokens = await tokenRefreshService.refreshTokenPair({
        expectedAuthState: failedAuthState,
        notifySessionExpired: true,
      });
      const snapshot = await userTokenStorage.getTokenSnapshot();

      if (!isSameTokenPair(snapshot.tokens, tokens)) {
        return null;
      }

      return {
        accessToken: tokens.accessToken,
        version: snapshot.version,
      };
    },
  });
};

export const refreshTokenPair = (): Promise<ITokenPair> => {
  return tokenRefreshService.refreshTokenPair();
};
