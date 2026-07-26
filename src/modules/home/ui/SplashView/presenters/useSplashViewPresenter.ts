import { useEffect, useRef } from 'react';

import { restoreAuthSession } from '@/modules/auth/services/authSessionService';
import { useAuthStore } from '@/storage/authStore';

import type { IUseSplashViewPresenterResult } from '../types';

export const useSplashViewPresenter = (): IUseSplashViewPresenterResult => {
  const clearUser = useAuthStore((state) => state.clearUser);
  const setSessionRestored = useAuthStore((state) => state.setSessionRestored);
  const setUser = useAuthStore((state) => state.setUser);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const onRestoreSession = async () => {
      try {
        const result = await restoreAuthSession();

        if (result.isAuthorized) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (error: unknown) {
        console.error('Unexpected splash restoration failure', error);
        clearUser();
      } finally {
        setSessionRestored(true);
      }
    };

    onRestoreSession().catch((error: unknown) => {
      console.error('Unable to finish splash session restoration', error);
    });
  }, [clearUser, setSessionRestored, setUser]);

  return {
    isRestoring: true,
  };
};
