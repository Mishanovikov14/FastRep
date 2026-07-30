export type AppEnvironmentKey = 'development' | 'production';

export interface IAppEnvironment {
  apiBaseUrl: string;
  displayName: string;
  isProduction: boolean;
  key: AppEnvironmentKey;
}

export type AppEnvironmentSelectionResult =
  | {
      environment: IAppEnvironment;
      status: 'changed';
    }
  | {
      environment: IAppEnvironment;
      status: 'rejected' | 'unchanged';
    };
