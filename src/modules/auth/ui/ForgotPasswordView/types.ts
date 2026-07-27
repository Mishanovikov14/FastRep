import type { TFunction } from 'i18next';

export interface IPresenterInput {
  t: TFunction;
}

export interface ForgotPasswordFormErrors {
  email?: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}
