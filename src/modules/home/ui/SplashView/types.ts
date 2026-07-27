import type { TFunction } from 'i18next';

export interface IPresenterInput {
  t: TFunction;
}

export interface IUseSplashViewPresenterResult {
  errorMessage?: string;
  hasTemporaryError: boolean;
  isLoading: boolean;
  onRetry(): Promise<void>;
}
