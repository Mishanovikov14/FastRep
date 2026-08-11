import { useCallback, useEffect, useRef, useState } from 'react';

import { useUserStore } from '@/entities/user/model/userStore';
import { restoreUserSession } from '@/entities/user/services/userSessionService';
import type { SessionRestoreResult } from '@/entities/user/types/session';
import { logger } from '@/libs/logger/logger';

import type { IPresenterInput, IUseSplashViewPresenterResult } from '../types';

const getTemporaryErrorMessage = (
  result: Extract<SessionRestoreResult, { status: 'temporary_error' }>,
  t: IPresenterInput['t'],
): string => {
  if (result.type === 'network_error') {
    return String(t('auth.session.networkUnavailable'));
  }

  if (result.type === 'timeout_error') {
    return String(t('auth.session.timeout'));
  }

  if (result.statusCode && result.statusCode >= 500) {
    return String(t('auth.session.serverError'));
  }

  return String(t('auth.session.genericError'));
};

export const useSplashViewPresenter = ({ t }: IPresenterInput): IUseSplashViewPresenterResult => {
  const clearUser = useUserStore((state) => state.clearUser);
  const setSessionRestored = useUserStore((state) => state.setSessionRestored);
  const setUser = useUserStore((state) => state.setUser);
  const hasStartedRef = useRef(false);
  const isRestoringRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const onRetry = useCallback(async () => {
    if (isRestoringRef.current) {
      return;
    }

    isRestoringRef.current = true;
    setErrorMessage(undefined);
    setIsLoading(true);
    setSessionRestored(false);

    try {
      const result = await restoreUserSession();

      switch (result.status) {
        case 'authorized':
          setUser(result.user);
          setSessionRestored(true);
          break;
        case 'unauthorized':
          clearUser();
          setSessionRestored(true);
          break;
        case 'temporary_error':
          setErrorMessage(getTemporaryErrorMessage(result, t));
          break;
      }
    } catch {
      logger.error('auth.splash_restoration_failed');
      setErrorMessage(String(t('auth.session.genericError')));
    } finally {
      isRestoringRef.current = false;
      setIsLoading(false);
    }
  }, [clearUser, setSessionRestored, setUser, t]);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    onRetry().catch(() => {
      logger.error('auth.splash_retry_failed');
    });
  }, [onRetry]);

  return {
    errorMessage,
    hasTemporaryError: Boolean(errorMessage),
    isLoading,
    onRetry,
  };
};
