import axios from 'axios';
import Config from 'react-native-config';

import { AxiosRequester } from './AxiosRequester';
import type { RequesterAuthCallbacks } from './IRequester';

export const resolveApiBaseUrl = (apiUrl: string | undefined, isDevelopment: boolean): string | undefined => {
  const normalizedApiUrl = apiUrl?.trim().replace(/\/+$/, '');

  if (!normalizedApiUrl && isDevelopment) {
    throw new Error('API_URL is required. Select a valid environment file before starting FastRep.');
  }

  return normalizedApiUrl || undefined;
};

export const axiosClient = axios.create({
  baseURL: resolveApiBaseUrl(Config.API_URL, __DEV__),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

const authCallbacks: RequesterAuthCallbacks = {
  async getAuthState() {
    return null;
  },
};

export const configureRequesterAuth = (callbacks: RequesterAuthCallbacks): void => {
  authCallbacks.getAuthState = callbacks.getAuthState;
  authCallbacks.refreshAuthState = callbacks.refreshAuthState;
};

export const requester = new AxiosRequester(axiosClient, authCallbacks);
