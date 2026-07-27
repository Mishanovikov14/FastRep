import type { TFunction } from 'i18next';

import type { IForgotPasswordRequest } from '@/entities/user/types/auth';

import type { ForgotPasswordFormErrors, ForgotPasswordFormValues } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export const validateForgotPassword = (
  values: ForgotPasswordFormValues,
  t: TFunction,
): ForgotPasswordFormErrors => {
  const email = values.email.trim();

  if (!email) {
    return {
      email: String(t('auth.forgotPassword.validation.emailRequired')),
    };
  }

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return {
      email: String(t('auth.forgotPassword.validation.emailInvalid')),
    };
  }

  return {};
};

export const normalizeForgotPasswordRequest = (
  values: ForgotPasswordFormValues,
): IForgotPasswordRequest => {
  return {
    email: values.email.trim().toLowerCase(),
  };
};
