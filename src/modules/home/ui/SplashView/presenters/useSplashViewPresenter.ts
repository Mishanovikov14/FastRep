import { useCallback, useEffect, useRef, useState } from 'react';

import { restoreAuthSession } from '@/modules/auth/services/authSessionService';
import { useAuthStore } from '@/storage/authStore';
import type { SessionRestoreResult } from '@/types/auth';

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

export const useSplashViewPresenter = ({
  t,
}: IPresenterInput): IUseSplashViewPresenterResult => {
  const clearUser = useAuthStore((state) => state.clearUser);
  const setSessionRestored = useAuthStore((state) => state.setSessionRestored);
  const setUser = useAuthStore((state) => state.setUser);
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
      const result = await restoreAuthSession();

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
    } catch (error: unknown) {
      console.error('Unexpected splash restoration failure', error);
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

    onRetry().catch((error: unknown) => {
      console.error('Unable to finish splash session restoration', error);
    });
  }, [onRetry]);

  return {
    errorMessage,
    hasTemporaryError: Boolean(errorMessage),
    isLoading,
    onRetry,
  };
};
