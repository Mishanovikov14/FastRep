import type { TFunction } from 'i18next';

import {
  normalizeForgotPasswordRequest,
  validateForgotPassword,
} from '@/modules/auth/ui/ForgotPasswordView/presenters/forgotPasswordValidation';
import {
  isValidOtpInput,
  validateOtp,
} from '@/modules/auth/ui/OtpVerificationView/presenters/otpValidation';
import { validateResetPassword } from '@/modules/auth/ui/ResetPasswordView/presenters/resetPasswordValidation';

const t = ((key: string) => key) as unknown as TFunction;

describe('password-recovery validation', () => {
  it('requires a valid email and normalizes surrounding spaces and casing', () => {
    expect(validateForgotPassword({ email: '   ' }, t)).toEqual({
      email: 'auth.forgotPassword.validation.emailRequired',
    });
    expect(validateForgotPassword({ email: 'not-an-email' }, t)).toEqual({
      email: 'auth.forgotPassword.validation.emailInvalid',
    });
    expect(
      normalizeForgotPasswordRequest({
        email: '  Alex.User@Example.COM  ',
      }),
    ).toEqual({
      email: 'alex.user@example.com',
    });
  });

  it('accepts exactly six numeric characters and preserves leading zeroes', () => {
    expect(isValidOtpInput('012345')).toBe(true);
    expect(validateOtp('012345', t)).toBeUndefined();
    expect(validateOtp('12345', t)).toBe('auth.otp.invalidCodeFormat');
    expect(validateOtp('1234567', t)).toBe('auth.otp.invalidCodeFormat');
    expect(isValidOtpInput('12a456')).toBe(false);
    expect(isValidOtpInput('12-456')).toBe(false);
    expect(isValidOtpInput('12 456')).toBe(false);
  });

  it('uses the registration password range and requires matching confirmation', () => {
    expect(
      validateResetPassword(
        {
          confirmPassword: '',
          password: '',
        },
        t,
      ),
    ).toEqual({
      confirmPassword: 'auth.resetPassword.validation.confirmPasswordRequired',
      password: 'auth.resetPassword.validation.passwordRequired',
    });
    expect(
      validateResetPassword(
        {
          confirmPassword: 'different',
          password: 'short',
        },
        t,
      ),
    ).toEqual({
      confirmPassword: 'auth.resetPassword.validation.passwordsMismatch',
      password: 'auth.resetPassword.validation.passwordMin',
    });

    const tooLong = 'a'.repeat(129);

    expect(
      validateResetPassword(
        {
          confirmPassword: tooLong,
          password: tooLong,
        },
        t,
      ).password,
    ).toBe('auth.resetPassword.validation.passwordMax');
  });
});
