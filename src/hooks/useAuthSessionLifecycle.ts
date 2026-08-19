import { useEffect, useRef } from 'react';

import { useUserStore } from '@/entities/user/model/userStore';
import { clearAuthenticatedResources } from '@/entities/user/services/authenticatedResourcesService';
import { logger } from '@/libs/logger/logger';

export const useAuthSessionLifecycle = (): void => {
  const isAuthorized = useUserStore((state) => state.isAuthorized);
  const previousIsAuthorizedRef = useRef(isAuthorized);

  useEffect(() => {
    const wasAuthorized = previousIsAuthorizedRef.current;

    if (wasAuthorized && !isAuthorized) {
      clearAuthenticatedResources().catch(() => {
        logger.error('auth.authenticated_resources_clear_failed');
      });
    }

    previousIsAuthorizedRef.current = isAuthorized;
  }, [isAuthorized]);
};
