import {
  beginAppEnvironmentSwitch,
  finishAppEnvironmentSwitch,
  selectAppEnvironment,
} from '@/entities/environment/services/appEnvironmentService';
import type {
  AppEnvironmentKey,
  AppEnvironmentSelectionResult,
} from '@/entities/environment/types/appEnvironment';

import { clearAuthenticatedResources } from './authenticatedResourcesService';
import { clearUserSession } from './userStateService';

interface ISwitchAppEnvironmentInput {
  currentUserEmail: string | null | undefined;
  targetEnvironment: AppEnvironmentKey;
}

export const switchAppEnvironment = async ({
  currentUserEmail,
  targetEnvironment,
}: ISwitchAppEnvironmentInput): Promise<AppEnvironmentSelectionResult> => {
  beginAppEnvironmentSwitch();

  const selection = selectAppEnvironment(targetEnvironment, currentUserEmail);

  if (selection.status !== 'changed') {
    finishAppEnvironmentSwitch();

    return selection;
  }

  try {
    await clearUserSession();
  } finally {
    try {
      await clearAuthenticatedResources();
    } finally {
      finishAppEnvironmentSwitch();
    }
  }

  return selection;
};
