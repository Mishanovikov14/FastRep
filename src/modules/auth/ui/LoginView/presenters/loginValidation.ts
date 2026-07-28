import type { TFunction } from 'i18next';

import type { ILoginRequest } from '@/entities/user/types/auth';

import type { LoginFormErrors, LoginFormValues } from '../types';

const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = (values: LoginFormValues, t: TFunction): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = String(t('auth.login.validation.emailRequired'));
  } else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = String(t('auth.login.validation.emailInvalid'));
  }

  if (!values.password) {
    errors.password = String(t('auth.login.validation.passwordRequired'));
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = String(t('auth.login.validation.passwordMin'));
  } else if (values.password.length > MAX_PASSWORD_LENGTH) {
    errors.password = String(t('auth.login.validation.passwordMax'));
  }

  return errors;
};

export const normalizeLoginRequest = (values: LoginFormValues): ILoginRequest => {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };
};
