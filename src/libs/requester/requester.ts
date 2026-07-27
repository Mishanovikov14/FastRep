import axios from 'axios';
import Config from 'react-native-config';

import { keychainStorage } from '@/libs/storage/KeychainStorage';

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
    const snapshot = await keychainStorage.getTokenSnapshot();

    return {
      accessToken: snapshot.tokens?.accessToken ?? null,
      version: snapshot.version,
    };
  },
};

export const configureRequesterAuth = (
  callbacks: Pick<RequesterAuthCallbacks, 'refreshAuthState'>,
): void => {
  authCallbacks.refreshAuthState = callbacks.refreshAuthState;
};

export const requester = new AxiosRequester(axiosClient, authCallbacks);
