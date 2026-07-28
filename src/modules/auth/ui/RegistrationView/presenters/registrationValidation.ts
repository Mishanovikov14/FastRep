import type { TFunction } from 'i18next';

import type { RegistrationFormErrors, RegistrationFormValues } from '@/modules/auth/ui/RegistrationView/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistration = (values: RegistrationFormValues, t: TFunction): RegistrationFormErrors => {
  const errors: RegistrationFormErrors = {};
  const fullName = values.fullName.trim();
  const email = values.email.trim();

  if (!fullName) {
    errors.fullName = String(t('auth.registration.validation.fullNameRequired'));
  } else if (fullName.length < 2) {
    errors.fullName = String(t('auth.registration.validation.fullNameMin'));
  } else if (fullName.length > 80) {
    errors.fullName = String(t('auth.registration.validation.fullNameMax'));
  }

  if (!email) {
    errors.email = String(t('auth.registration.validation.emailRequired'));
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = String(t('auth.registration.validation.emailInvalid'));
  }

  if (!values.password) {
    errors.password = String(t('auth.registration.validation.passwordRequired'));
  } else if (values.password.length < 8) {
    errors.password = String(t('auth.registration.validation.passwordMin'));
  } else if (values.password.length > 128) {
    errors.password = String(t('auth.registration.validation.passwordMax'));
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = String(t('auth.registration.validation.confirmPasswordRequired'));
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = String(t('auth.registration.validation.passwordsMismatch'));
  }

  return errors;
};
