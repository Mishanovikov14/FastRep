import { useEffect, useRef } from 'react';

import { useUserStore } from '@/entities/user/model/userStore';
import { clearAuthenticatedResources } from '@/entities/user/services/authenticatedResourcesService';

export const useAuthSessionLifecycle = (): void => {
  const isAuthorized = useUserStore((state) => state.isAuthorized);
  const previousIsAuthorizedRef = useRef(isAuthorized);

  useEffect(() => {
    const wasAuthorized = previousIsAuthorizedRef.current;

    if (wasAuthorized && !isAuthorized) {
      clearAuthenticatedResources().catch((error: unknown) => {
        console.error('Unable to clear authenticated application resources', error);
      });
    }

    previousIsAuthorizedRef.current = isAuthorized;
  }, [isAuthorized]);
};
