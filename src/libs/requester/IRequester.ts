import type { AxiosRequestConfig } from 'axios';

import type { IResponse } from './IResponse';

export interface IRequestConfig<Data = unknown> extends AxiosRequestConfig<Data> {
  requiresAuth?: boolean;
  skipAuthRefresh?: boolean;
}

export interface IRequester {
  request<T>(config: IRequestConfig): Promise<IResponse<T>>;
}

export interface IRequesterAuthState {
  accessToken: string | null;
  version: number;
}

export interface RequesterAuthCallbacks {
  getAuthState(): Promise<IRequesterAuthState | null>;
  refreshAuthState?(failedAuthState: IRequesterAuthState | null): Promise<IRequesterAuthState | null>;
}
