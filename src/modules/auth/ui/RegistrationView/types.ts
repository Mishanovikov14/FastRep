import type { TFunction } from 'i18next';

import type { SupportedLanguage } from '@/localization/types';

export interface IPresenterInput {
  language: SupportedLanguage;
  t: TFunction;
}

export interface RegistrationFormErrors {
  confirmPassword?: string;
  email?: string;
  fullName?: string;
  password?: string;
}

export interface RegistrationFormValues {
  confirmPassword: string;
  email: string;
  fullName: string;
  password: string;
}
