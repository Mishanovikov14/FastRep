import axios from 'axios';
import Config from 'react-native-config';

import { AxiosRequester } from './AxiosRequester';

export const axiosClient = axios.create({
  baseURL: Config.API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

export const requester = new AxiosRequester(axiosClient);
