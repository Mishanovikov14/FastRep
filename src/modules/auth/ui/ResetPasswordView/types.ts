import type { TFunction } from 'i18next';

export interface IPresenterInput {
  t: TFunction;
}

export interface ResetPasswordFormErrors {
  confirmPassword?: string;
  password?: string;
}

export interface ResetPasswordFormValues {
  confirmPassword: string;
  password: string;
}
