import axios from 'axios';

import { AxiosRequester } from './AxiosRequester';
import type { RequesterAuthCallbacks, RequesterEnvironmentCallbacks } from './IRequester';

export const axiosClient = axios.create({
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

const environmentCallbacks: RequesterEnvironmentCallbacks = {
  getBaseUrl() {
    throw new Error('The application environment has not been initialized.');
  },
};

let environmentCancelSource = axios.CancelToken.source();

export const configureRequesterAuth = (callbacks: RequesterAuthCallbacks): void => {
  authCallbacks.getAuthState = callbacks.getAuthState;
  authCallbacks.refreshAuthState = callbacks.refreshAuthState;
};

export const configureRequesterEnvironment = (callbacks: RequesterEnvironmentCallbacks): void => {
  environmentCallbacks.getBaseUrl = callbacks.getBaseUrl;
  environmentCallbacks.getCancelToken = () => environmentCancelSource.token;
};

export const cancelRequesterRequests = (): void => {
  environmentCancelSource.cancel('The application environment changed.');
  environmentCancelSource = axios.CancelToken.source();
};

export const requester = new AxiosRequester(axiosClient, authCallbacks, environmentCallbacks);
