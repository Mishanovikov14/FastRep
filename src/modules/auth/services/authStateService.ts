import { keychainStorage } from '@/libs/storage/KeychainStorage';
import type { ITokenSnapshot } from '@/libs/storage/types';
import { useAuthStore } from '@/storage/authStore';

export const clearAuthSession = async (): Promise<void> => {
  try {
    await keychainStorage.clearTokens();
  } finally {
    useAuthStore.getState().resetAuth();
  }
};

export const clearAuthSessionIfCurrent = async (
  snapshot: ITokenSnapshot,
): Promise<boolean> => {
  let wasCleared: boolean;

  try {
    wasCleared = await keychainStorage.clearTokensIfCurrent(snapshot);
  } catch (error: unknown) {
    useAuthStore.getState().resetAuth();

    throw error;
  }

  if (!wasCleared) {
    return false;
  }

  useAuthStore.getState().resetAuth();

  return true;
};
