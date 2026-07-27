import type { TFunction } from 'i18next';

import {
  normalizeLoginRequest,
  validateLogin,
} from '@/modules/auth/ui/LoginView/presenters/loginValidation';
import type { LoginFormValues } from '@/modules/auth/ui/LoginView/types';

const t = ((key: string) => key) as unknown as TFunction;

const getFieldError = (
  values: LoginFormValues,
  field: keyof LoginFormValues,
): string | undefined => {
  return validateLogin(values, t)[field];
};

describe('login validation', () => {
  it('validates required and correctly formatted email values', () => {
    expect(getFieldError({ email: '   ', password: 'password123' }, 'email')).toBe(
      'auth.login.validation.emailRequired',
    );
    expect(getFieldError({ email: 'invalid-email', password: 'password123' }, 'email')).toBe(
      'auth.login.validation.emailInvalid',
    );
    expect(
      getFieldError(
        {
          email: `${'a'.repeat(250)}@b.co`,
          password: 'password123',
        },
        'email',
      ),
    ).toBe('auth.login.validation.emailInvalid');
  });

  it('enforces the password length range', () => {
    expect(getFieldError({ email: 'alex@example.com', password: '' }, 'password')).toBe(
      'auth.login.validation.passwordRequired',
    );
    expect(getFieldError({ email: 'alex@example.com', password: 'short' }, 'password')).toBe(
      'auth.login.validation.passwordMin',
    );
    expect(
      getFieldError({ email: 'alex@example.com', password: 'a'.repeat(129) }, 'password'),
    ).toBe('auth.login.validation.passwordMax');
  });

  it('accepts valid values at the password boundaries', () => {
    expect(validateLogin({ email: 'alex@example.com', password: 'a'.repeat(8) }, t)).toEqual({});
    expect(validateLogin({ email: 'alex@example.com', password: 'a'.repeat(128) }, t)).toEqual({});
  });

  it('normalizes email without changing the password', () => {
    expect(
      normalizeLoginRequest({
        email: '  Alex.User@Example.COM  ',
        password: '  password123  ',
      }),
    ).toEqual({
      email: 'alex.user@example.com',
      password: '  password123  ',
    });
  });
});
