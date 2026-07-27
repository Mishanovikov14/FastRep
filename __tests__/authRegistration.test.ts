import type { TFunction } from 'i18next';

import { register } from '@/entities/user/API/userApi';
import { useUserStore } from '@/entities/user/model/userStore';
import type { IUser } from '@/entities/user/types/user';
import { requester } from '@/libs/requester/requester';
import { validateRegistration } from '@/modules/auth/ui/RegistrationView/presenters/registrationValidation';

jest.mock('@/libs/requester/requester', () => ({
  requester: {
    request: jest.fn(),
  },
}));

const t = ((key: string) => key) as unknown as TFunction;

const user: IUser = {
  createdAt: '2026-07-26T10:00:00.000Z',
  email: 'alex@example.com',
  fullName: 'Alex Morgan',
  id: 'user-1',
  isPremium: false,
  language: 'en',
  photoUrl: null,
  updatedAt: '2026-07-26T10:00:00.000Z',
};

describe('registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.getState().clearUser();
  });

  it('sends the exact backend registration contract through the shared requester', async () => {
    const request = jest.mocked(requester.request);
    request.mockResolvedValue({
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user,
      },
      isError: false,
      message: '',
    });

    const payload = {
      email: 'alex@example.com',
      fullName: 'Alex Morgan',
      language: 'en' as const,
      password: 'password123',
    };

    await register(payload);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      data: payload,
      method: 'POST',
      requiresAuth: false,
      url: '/auth/register',
    });
  });

  it('validates every registration field before submission', () => {
    const errors = validateRegistration(
      {
        confirmPassword: 'different',
        email: 'invalid-email',
        fullName: 'A',
        password: 'short',
      },
      t,
    );

    expect(errors).toEqual({
      confirmPassword: 'auth.registration.validation.passwordsMismatch',
      email: 'auth.registration.validation.emailInvalid',
      fullName: 'auth.registration.validation.fullNameMin',
      password: 'auth.registration.validation.passwordMin',
    });
  });

  it('rejects required fields and full names longer than 80 characters', () => {
    const requiredErrors = validateRegistration(
      {
        confirmPassword: '',
        email: '',
        fullName: '',
        password: '',
      },
      t,
    );
    const lengthErrors = validateRegistration(
      {
        confirmPassword: 'password123',
        email: 'alex@example.com',
        fullName: 'A'.repeat(81),
        password: 'password123',
      },
      t,
    );

    expect(requiredErrors).toEqual({
      confirmPassword: 'auth.registration.validation.confirmPasswordRequired',
      email: 'auth.registration.validation.emailRequired',
      fullName: 'auth.registration.validation.fullNameRequired',
      password: 'auth.registration.validation.passwordRequired',
    });
    expect(lengthErrors.fullName).toBe('auth.registration.validation.fullNameMax');
  });

  it('accepts a valid registration form', () => {
    const errors = validateRegistration(
      {
        confirmPassword: 'password123',
        email: 'alex@example.com',
        fullName: 'Alex Morgan',
        password: 'password123',
      },
      t,
    );

    expect(errors).toEqual({});
  });

  it('stores and clears only authenticated user state', () => {
    useUserStore.getState().setUser(user);

    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: true,
      user,
    });

    useUserStore.getState().clearUser();

    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      user: null,
    });
  });
});
