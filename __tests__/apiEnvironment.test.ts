import { APP_ENVIRONMENTS, getDefaultAppEnvironmentKey } from '@/entities/environment/config/appEnvironments';
import { useAppEnvironmentStore } from '@/entities/environment/model/appEnvironmentStore';
import {
  enforceAppEnvironmentForAuthenticatedUser,
  isEnvironmentOwner,
  resolveInitialAppEnvironmentKey,
  selectAppEnvironment,
} from '@/entities/environment/services/appEnvironmentService';
import { storage } from '@/libs/storage';
import { storageKeys } from '@/libs/storage/storageKeys';

export {};

declare const __dirname: string;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const { resolve } = require('path') as {
  resolve(...paths: string[]): string;
};

const readProjectFile = (relativePath: string): string => {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf8');
};

describe('API environment selection', () => {
  beforeEach(() => {
    storage.clearAll();
    useAppEnvironmentStore.getState().setActiveEnvironment('production');
    useAppEnvironmentStore.getState().setIsSwitching(false);
  });

  it('centralizes the two public API environments', () => {
    expect(APP_ENVIRONMENTS).toEqual({
      development: {
        apiBaseUrl: 'https://fastrep-api-development.up.railway.app',
        displayName: 'Development',
        isProduction: false,
        key: 'development',
      },
      production: {
        apiBaseUrl: 'https://api.fastrep.app',
        displayName: 'Production',
        isProduction: true,
        key: 'production',
      },
    });
  });

  it('defaults debug builds to Development and release builds to Production', () => {
    expect(getDefaultAppEnvironmentKey(true)).toBe('development');
    expect(getDefaultAppEnvironmentKey(false)).toBe('production');
  });

  it('normalizes the owner email before comparison', () => {
    expect(isEnvironmentOwner('  Mishanovikov14@GMAIL.COM ')).toBe(true);
    expect(isEnvironmentOwner('another@example.com')).toBe(false);
  });

  it('lets the owner switch between Development and Production', () => {
    expect(selectAppEnvironment('development', 'mishanovikov14@gmail.com')).toMatchObject({
      environment: APP_ENVIRONMENTS.development,
      status: 'changed',
    });
    expect(storage.get(storageKeys.SELECTED_ENVIRONMENT)).toBe('development');

    expect(selectAppEnvironment('production', 'mishanovikov14@gmail.com')).toMatchObject({
      environment: APP_ENVIRONMENTS.production,
      status: 'changed',
    });
    expect(storage.get(storageKeys.SELECTED_ENVIRONMENT)).toBe('production');
  });

  it('rejects Development for non-owners and forces Production', () => {
    const result = selectAppEnvironment('development', 'runner@fastrep.dev');

    expect(result).toMatchObject({
      environment: APP_ENVIRONMENTS.production,
      status: 'rejected',
    });
    expect(useAppEnvironmentStore.getState().activeEnvironment).toEqual(APP_ENVIRONMENTS.production);
    expect(storage.get(storageKeys.SELECTED_ENVIRONMENT)).toBe('production');
  });

  it('removes an invalid persisted environment and uses the build default', () => {
    storage.set(storageKeys.SELECTED_ENVIRONMENT, 'staging');

    expect(resolveInitialAppEnvironmentKey(true)).toBe('development');
    expect(storage.contains(storageKeys.SELECTED_ENVIRONMENT)).toBe(false);
  });

  it('forces Production when a non-owner authenticates on Development', () => {
    useAppEnvironmentStore.getState().setActiveEnvironment('development');

    expect(enforceAppEnvironmentForAuthenticatedUser('runner@fastrep.dev')).toBe(false);
    expect(useAppEnvironmentStore.getState().activeEnvironment).toEqual(APP_ENVIRONMENTS.production);
    expect(storage.get(storageKeys.SELECTED_ENVIRONMENT)).toBe('production');
  });

  it('does not use build-time API variables or NODE_ENV for backend selection', () => {
    const activeConfiguration = [
      readProjectFile('.env'),
      readProjectFile('.env.development'),
      readProjectFile('.env.production'),
      readProjectFile('.env.example'),
      readProjectFile('src/entities/environment/config/appEnvironments.ts'),
    ].join('\n');

    expect(activeConfiguration).not.toContain('API_URL=');
    expect(activeConfiguration).not.toContain('NODE_ENV');
  });
});
