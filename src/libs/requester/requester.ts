import axios from 'axios';
import Config from 'react-native-config';

import { AxiosRequester } from './AxiosRequester';
import type { RequesterAuthCallbacks } from './IRequester';

export const axiosClient = axios.create({
  baseURL: Config.API_URL,
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

export const configureRequesterAuth = (
  callbacks: RequesterAuthCallbacks,
): void => {
  authCallbacks.getAuthState = callbacks.getAuthState;
  authCallbacks.refreshAuthState = callbacks.refreshAuthState;
};

export const requester = new AxiosRequester(axiosClient, authCallbacks);
