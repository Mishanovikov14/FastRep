import type { AxiosRequestConfig } from 'axios';

import type { IResponse } from './IResponse';

export interface IRequester {
  request<T>(config: AxiosRequestConfig): Promise<IResponse<T>>;
}

export interface RequesterAuthCallbacks {
  getAccessToken(): Promise<string | null>;
  onUnauthorized(): Promise<void>;
}
