import type { TFunction } from 'i18next';

export interface IPresenterInput {
  t: TFunction;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
