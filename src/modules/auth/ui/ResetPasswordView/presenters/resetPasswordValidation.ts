import type { TFunction } from 'i18next';

import type { ResetPasswordFormErrors, ResetPasswordFormValues } from '../types';

export const validateResetPassword = (
  values: ResetPasswordFormValues,
  t: TFunction,
): ResetPasswordFormErrors => {
  const errors: ResetPasswordFormErrors = {};

  if (!values.password) {
    errors.password = String(t('auth.resetPassword.validation.passwordRequired'));
  } else if (values.password.length < 8) {
    errors.password = String(t('auth.resetPassword.validation.passwordMin'));
  } else if (values.password.length > 128) {
    errors.password = String(t('auth.resetPassword.validation.passwordMax'));
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = String(
      t('auth.resetPassword.validation.confirmPasswordRequired'),
    );
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = String(
      t('auth.resetPassword.validation.passwordsMismatch'),
    );
  }

  return errors;
};
