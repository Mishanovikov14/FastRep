import type { AxiosInstance, RawAxiosHeaders } from 'axios';
import { AxiosHeaders } from 'axios';
import { Platform } from 'react-native';
import { getUniqueId, getVersion } from 'react-native-device-info';

import { i18n } from '@/localization/i18n';

import type {
  IRequestConfig,
  IRequester,
  IRequesterAuthState,
  RequesterAuthCallbacks,
} from './IRequester';
import type { IResponse } from './IResponse';
import { normalizeRequestError } from './RequestError';

const DEFAULT_AUTH_CALLBACKS: RequesterAuthCallbacks = {
  async getAuthState() {
    return null;
  },
};

const isSameAuthState = (
  left: IRequesterAuthState | null,
  right: IRequesterAuthState,
): boolean => {
  return (
    left?.accessToken === right.accessToken && left.version === right.version
  );
};

export class AxiosRequester implements IRequester {
  constructor(
    private readonly client: AxiosInstance,
    private readonly authCallbacks: RequesterAuthCallbacks = DEFAULT_AUTH_CALLBACKS,
  ) {}

  async request<T>(config: IRequestConfig): Promise<IResponse<T>> {
    return this.performRequest<T>(config, false);
  }

  private async performRequest<T>(
    config: IRequestConfig,
    hasRetriedAuth: boolean,
    requiredAuthState?: IRequesterAuthState,
    authFailureResponse?: IResponse<T>,
  ): Promise<IResponse<T>> {
    const headers = AxiosHeaders.from(config.headers as RawAxiosHeaders | AxiosHeaders | undefined);
    const platform = Platform.OS.toUpperCase();
    const { requiresAuth = true, skipAuthRefresh = false, ...axiosConfig } = config;
    let authStateForRequest: IRequesterAuthState | null = null;

    headers.set('X-Locale', i18n.language || 'en');
    headers.set('X-Platform', platform);
    headers.set('X-App-Version', getVersion());

    try {
      const deviceId = await getUniqueId();

      if (deviceId) {
        headers.set('X-Device-ID', deviceId);
      }
    } catch {
      // A request must remain usable when a stable device ID is unavailable.
    }

    if (requiresAuth) {
      try {
        authStateForRequest = await this.authCallbacks.getAuthState();
      } catch {
        authStateForRequest = null;
      }

      if (
        requiredAuthState &&
        !isSameAuthState(authStateForRequest, requiredAuthState)
      ) {
        if (authFailureResponse) {
          return authFailureResponse;
        }

        return {
          isError: true,
          message: 'The authentication session changed before the request was sent.',
          type: 'stale_auth_session',
        };
      }

      if (authStateForRequest?.accessToken) {
        headers.set('Authorization', `Bearer ${authStateForRequest.accessToken}`);
      } else {
        headers.delete('Authorization');
      }
    } else {
      headers.delete('Authorization');
    }

    try {
      const response = await this.client.request<T>({
        ...axiosConfig,
        headers,
      });

      return {
        data: response.data,
        isError: false,
        message: '',
      };
    } catch (error: unknown) {
      const normalizedError = normalizeRequestError(error);
      const canRefresh =
        normalizedError.status === 401 &&
        requiresAuth &&
        authStateForRequest !== null &&
        !skipAuthRefresh &&
        !hasRetriedAuth &&
        Boolean(this.authCallbacks.refreshAuthState);

      if (!canRefresh || !this.authCallbacks.refreshAuthState) {
        return normalizedError;
      }

      try {
        const refreshedAuthState =
          await this.authCallbacks.refreshAuthState(authStateForRequest);

        if (!refreshedAuthState) {
          return normalizedError;
        }

        return this.performRequest<T>(
          config,
          true,
          refreshedAuthState,
          normalizedError,
        );
      } catch {
        return normalizedError;
      }
    }
  }
}
