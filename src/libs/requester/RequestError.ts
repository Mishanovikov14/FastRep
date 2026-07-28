import axios, { AxiosError } from 'axios';

import type { IResponse } from './IResponse';

interface BackendErrorBody {
  errors?: unknown;
  message?: unknown;
  type?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const parseBackendError = (value: unknown): BackendErrorBody => {
  return isRecord(value) ? value : {};
};

export const normalizeRequestError = (error: unknown): IResponse<never> => {
  if (!axios.isAxiosError(error)) {
    return {
      errors: error,
      isError: true,
      message: 'Something went wrong.',
      type: 'unexpected_error',
    };
  }

  const axiosError = error as AxiosError<unknown>;
  const backendError = parseBackendError(axiosError.response?.data);
  const isTimeout = axiosError.code === AxiosError.ECONNABORTED || axiosError.code === AxiosError.ETIMEDOUT;
  const isNetworkError = axiosError.code === AxiosError.ERR_NETWORK || !axiosError.response;

  let message = axiosError.message || 'Something went wrong.';

  if (typeof backendError.message === 'string' && backendError.message.length > 0) {
    message = backendError.message;
  } else if (isTimeout) {
    message = 'The request timed out.';
  } else if (isNetworkError) {
    message = 'Network connection is unavailable.';
  }

  return {
    errors: backendError.errors ?? axiosError.response?.data,
    isError: true,
    message,
    status: axiosError.response?.status,
    type:
      typeof backendError.type === 'string'
        ? backendError.type
        : isTimeout
        ? 'timeout_error'
        : isNetworkError
        ? 'network_error'
        : undefined,
  };
};
