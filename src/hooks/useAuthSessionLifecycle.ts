import { useEffect, useRef } from 'react';

import { clearAuthenticatedResources } from '@/services/authenticatedResourcesService';
import { useAuthStore } from '@/storage/authStore';

export const useAuthSessionLifecycle = (): void => {
  const isAuthorized = useAuthStore((state) => state.isAuthorized);
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
