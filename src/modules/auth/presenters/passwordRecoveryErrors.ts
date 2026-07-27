import type { TFunction } from 'i18next';

import type { IResponse } from '@/libs/requester/IResponse';

type RecoveryRequest = Pick<IResponse<unknown>, 'message' | 'status' | 'type'>;

const getTransportErrorKey = (
  response: RecoveryRequest,
):
  | 'auth.recovery.networkError'
  | 'auth.recovery.serverUnavailable'
  | 'auth.recovery.timeoutError'
  | undefined => {
  if (response.type === 'network_error') {
    return 'auth.recovery.networkError';
  }

  if (response.type === 'timeout_error' || response.status === 408) {
    return 'auth.recovery.timeoutError';
  }

  if (response.status === 503 || (response.status !== undefined && response.status >= 500)) {
    return 'auth.recovery.serverUnavailable';
  }

  return undefined;
};

export const getForgotPasswordErrorMessage = (
  response: RecoveryRequest,
  t: TFunction,
): string => {
  const transportKey = getTransportErrorKey(response);

  if (transportKey) {
    return String(t(transportKey));
  }

  if (response.status === 429) {
    return String(t('auth.recovery.rateLimited'));
  }

  return String(t('common.somethingWentWrong'));
};

export const getResetPasswordErrorMessage = (
  response: RecoveryRequest,
  t: TFunction,
): string => {
  const transportKey = getTransportErrorKey(response);

  if (transportKey) {
    return String(t(transportKey));
  }

  if (response.status === 429) {
    return String(t('auth.recovery.rateLimited'));
  }

  if (response.status === 400) {
    const safeHint = `${response.type ?? ''} ${response.message}`.toLowerCase();

    if (safeHint.includes('used')) {
      return String(t('auth.recovery.usedCode'));
    }

    if (safeHint.includes('attempt') || safeHint.includes('exhaust')) {
      return String(t('auth.recovery.tooManyAttempts'));
    }

    return String(t('auth.recovery.invalidOrExpiredCode'));
  }

  return String(t('common.somethingWentWrong'));
};
