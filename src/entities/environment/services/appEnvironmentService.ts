import { cancelRequesterRequests, configureRequesterEnvironment } from '@/libs/requester/requester';
import { storage } from '@/libs/storage';
import { storageKeys } from '@/libs/storage/storageKeys';

import { APP_ENVIRONMENTS, getDefaultAppEnvironmentKey } from '../config/appEnvironments';
import { useAppEnvironmentStore } from '../model/appEnvironmentStore';
import type {
  AppEnvironmentKey,
  AppEnvironmentSelectionResult,
  IAppEnvironment,
} from '../types/appEnvironment';

const OWNER_EMAIL = 'mishanovikov14@gmail.com';

const isAppEnvironmentKey = (value: unknown): value is AppEnvironmentKey => {
  return value === 'development' || value === 'production';
};

export const normalizeEnvironmentOwnerEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const isEnvironmentOwner = (email: string | null | undefined): boolean => {
  return typeof email === 'string' && normalizeEnvironmentOwnerEmail(email) === OWNER_EMAIL;
};

export const resolveInitialAppEnvironmentKey = (isDevelopmentBuild: boolean): AppEnvironmentKey => {
  const savedValue = storage.get<unknown>(storageKeys.SELECTED_ENVIRONMENT);

  if (savedValue === null) {
    if (storage.contains(storageKeys.SELECTED_ENVIRONMENT)) {
      storage.remove(storageKeys.SELECTED_ENVIRONMENT);
    }

    return getDefaultAppEnvironmentKey(isDevelopmentBuild);
  }

  if (!isAppEnvironmentKey(savedValue)) {
    storage.remove(storageKeys.SELECTED_ENVIRONMENT);

    return getDefaultAppEnvironmentKey(isDevelopmentBuild);
  }

  return savedValue;
};

export const getActiveAppEnvironment = (): IAppEnvironment => {
  return useAppEnvironmentStore.getState().activeEnvironment;
};

export const getActiveApiBaseUrl = (): string => {
  if (useAppEnvironmentStore.getState().isSwitching) {
    throw new Error('API requests are paused while the application environment is switching.');
  }

  return getActiveAppEnvironment().apiBaseUrl;
};

export const isAppEnvironmentSwitching = (): boolean => {
  return useAppEnvironmentStore.getState().isSwitching;
};

export const initializeAppEnvironment = (): void => {
  const initialKey = resolveInitialAppEnvironmentKey(__DEV__);

  useAppEnvironmentStore.getState().setActiveEnvironment(initialKey);
  configureRequesterEnvironment({
    getBaseUrl: getActiveApiBaseUrl,
  });
};

export const beginAppEnvironmentSwitch = (): void => {
  useAppEnvironmentStore.getState().setIsSwitching(true);
  cancelRequesterRequests();
};

export const finishAppEnvironmentSwitch = (): void => {
  useAppEnvironmentStore.getState().setIsSwitching(false);
};

const activateEnvironment = (key: AppEnvironmentKey): IAppEnvironment => {
  storage.set(storageKeys.SELECTED_ENVIRONMENT, key);
  useAppEnvironmentStore.getState().setActiveEnvironment(key);

  return APP_ENVIRONMENTS[key];
};

export const selectAppEnvironment = (
  key: AppEnvironmentKey,
  currentUserEmail: string | null | undefined,
): AppEnvironmentSelectionResult => {
  const currentEnvironment = getActiveAppEnvironment();

  if (!isEnvironmentOwner(currentUserEmail)) {
    const productionEnvironment = activateEnvironment('production');

    return {
      environment: productionEnvironment,
      status: currentEnvironment.key === 'production' ? 'rejected' : 'changed',
    };
  }

  if (currentEnvironment.key === key) {
    return {
      environment: currentEnvironment,
      status: 'unchanged',
    };
  }

  return {
    environment: activateEnvironment(key),
    status: 'changed',
  };
};

export const enforceAppEnvironmentForAuthenticatedUser = (email: string): boolean => {
  if (isEnvironmentOwner(email)) {
    return true;
  }

  const wasDevelopment = getActiveAppEnvironment().key === 'development';

  activateEnvironment('production');

  return !wasDevelopment;
};
