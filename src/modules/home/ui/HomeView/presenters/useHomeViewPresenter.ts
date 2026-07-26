import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { toastService } from '@/libs/toast/toastService';
import { logout } from '@/modules/auth/API/authApi';
import { clearAuthSession } from '@/modules/auth/services/authStateService';
import { useAuthStore } from '@/storage/authStore';

import type { IPresenterInput } from '../types';

export const useHomeViewPresenter = ({ t }: IPresenterInput) => {
  const user = useAuthStore((state) => state.user);
  const isLoggingOutRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: mutateLogout } = useMutation({
    mutationFn: logout,
  });

  const onLogout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;
    setIsLoading(true);
    let hasRemoteError = false;

    try {
      const tokens = await keychainStorage.getTokens();

      if (tokens) {
        const response = await mutateLogout(tokens.refreshToken);

        hasRemoteError = response.isError;
      }
    } catch (error: unknown) {
      console.error('Unexpected logout failure', error);
      hasRemoteError = true;
    } finally {
      try {
        await clearAuthSession();
      } catch (error: unknown) {
        console.error('Unable to clear the local authentication session', error);
        hasRemoteError = true;
      }

      if (hasRemoteError) {
        toastService.showError(String(t('common.error')), String(t('home.logoutError')));
      }

      isLoggingOutRef.current = false;
      setIsLoading(false);
    }
  }, [mutateLogout, t]);

  return {
    isLoading,
    onLogout,
    user,
  };
};
