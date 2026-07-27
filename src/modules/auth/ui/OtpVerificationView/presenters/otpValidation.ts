import type { TFunction } from 'i18next';

const OTP_PATTERN = /^\d{6}$/;

export const isValidOtpInput = (value: string): boolean => {
  return /^\d{0,6}$/.test(value);
};

export const validateOtp = (value: string, t: TFunction): string | undefined => {
  if (!OTP_PATTERN.test(value)) {
    return String(t('auth.otp.invalidCodeFormat'));
  }

  return undefined;
};
