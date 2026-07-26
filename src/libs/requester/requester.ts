import axios from 'axios';
import Config from 'react-native-config';

import { keychainStorage } from '@/libs/storage/KeychainStorage';

import { AxiosRequester } from './AxiosRequester';

export const axiosClient = axios.create({
  baseURL: Config.API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

export const requester = new AxiosRequester(axiosClient, {
  async getAccessToken() {
    const tokens = await keychainStorage.getTokens();

    return tokens?.accessToken ?? null;
  },
});
