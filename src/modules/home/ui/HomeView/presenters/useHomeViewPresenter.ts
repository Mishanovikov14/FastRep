import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { logout } from '@/entities/user/API/userApi';
import { useUserStore } from '@/entities/user/model/userStore';
import { clearUserSession } from '@/entities/user/services/userStateService';
import { userTokenStorage } from '@/entities/user/services/userTokenStorage';
import { toastService } from '@/libs/toast/toastService';

import type { IPresenterInput } from '../types';

export const useHomeViewPresenter = ({ t }: IPresenterInput) => {
  const user = useUserStore((state) => state.user);
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
      const tokens = await userTokenStorage.getTokens();

      if (tokens) {
        const response = await mutateLogout(tokens.refreshToken);

        hasRemoteError = response.isError;
      }
    } catch (error: unknown) {
      console.error('Unexpected logout failure', error);
      hasRemoteError = true;
    } finally {
      try {
        await clearUserSession();
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
