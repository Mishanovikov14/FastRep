import { useUserStore } from '@/entities/user/model/userStore';
import type { ITokenSnapshot } from '@/entities/user/types/session';

import { userTokenStorage } from './userTokenStorage';

export const clearUserSession = async (): Promise<void> => {
  try {
    await userTokenStorage.clearTokens();
  } finally {
    useUserStore.getState().resetUser();
  }
};

export const clearUserSessionIfCurrent = async (
  snapshot: ITokenSnapshot,
): Promise<boolean> => {
  let wasCleared: boolean;

  try {
    wasCleared = await userTokenStorage.clearTokensIfCurrent(snapshot);
  } catch (error: unknown) {
    useUserStore.getState().resetUser();

    throw error;
  }

  if (!wasCleared) {
    return false;
  }

  useUserStore.getState().resetUser();

  return true;
};
