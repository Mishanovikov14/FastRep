import type { AxiosInstance, AxiosRequestConfig, RawAxiosHeaders } from 'axios';
import { AxiosHeaders } from 'axios';
import { Platform } from 'react-native';
import { getUniqueId, getVersion } from 'react-native-device-info';

import { i18n } from '@/localization';

import type { IRequester, RequesterAuthCallbacks } from './IRequester';
import type { IResponse } from './IResponse';
import { normalizeRequestError } from './RequestError';

const DEFAULT_AUTH_CALLBACKS: RequesterAuthCallbacks = {
  async getAccessToken() {
    return null;
  },
};

export class AxiosRequester implements IRequester {
  constructor(
    private readonly client: AxiosInstance,
    private readonly authCallbacks: RequesterAuthCallbacks = DEFAULT_AUTH_CALLBACKS,
  ) {}

  async request<T>(config: AxiosRequestConfig): Promise<IResponse<T>> {
    const headers = AxiosHeaders.from(config.headers as RawAxiosHeaders | AxiosHeaders | undefined);
    const platform = Platform.OS.toUpperCase();

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

    try {
      const accessToken = await this.authCallbacks.getAccessToken();

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    } catch {
      // Token access is optional until authentication is implemented.
    }

    try {
      const response = await this.client.request<T>({
        ...config,
        headers,
      });

      return {
        data: response.data,
        isError: false,
        message: '',
      };
    } catch (error: unknown) {
      return normalizeRequestError(error);
    }
  }
}
