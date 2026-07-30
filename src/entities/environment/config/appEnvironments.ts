import type { AppEnvironmentKey, IAppEnvironment } from '../types/appEnvironment';

export const APP_ENVIRONMENTS: Record<AppEnvironmentKey, IAppEnvironment> = {
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
};

export const getDefaultAppEnvironmentKey = (isDevelopmentBuild: boolean): AppEnvironmentKey => {
  return isDevelopmentBuild ? 'development' : 'production';
};
