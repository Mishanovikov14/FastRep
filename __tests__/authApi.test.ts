import {
  forgotPassword,
  getMe,
  getMeWithoutRefresh,
  login,
  logout,
  refresh,
  register,
  resendRegistrationCode,
  resetPassword,
  verifyRegistration,
} from '@/entities/user/API/userApi';
import { requester } from '@/libs/requester/requester';

jest.mock('@/libs/requester/requester', () => ({
  requester: {
    request: jest.fn(),
  },
}));

describe('auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requester.request).mockResolvedValue({
      isError: false,
      message: '',
    });
  });

  it('sends login through the public auth endpoint', async () => {
    const request = {
      email: 'alex@example.com',
      password: 'password123',
    };

    await login(request);

    expect(requester.request).toHaveBeenCalledWith({
      data: request,
      method: 'POST',
      requiresAuth: false,
      url: '/auth/login',
    });
  });

  it('sends registration and verification through their public endpoints', async () => {
    const registrationRequest = {
      email: 'alex@example.com',
      fullName: 'Alex Morgan',
      language: 'en' as const,
      password: 'password123',
    };

    await register(registrationRequest);
    await verifyRegistration({
      code: '123456',
      email: 'alex@example.com',
    });

    expect(requester.request).toHaveBeenNthCalledWith(1, {
      data: registrationRequest,
      method: 'POST',
      requiresAuth: false,
      url: '/auth/register',
    });
    expect(requester.request).toHaveBeenNthCalledWith(2, {
      data: {
        code: '123456',
        email: 'alex@example.com',
      },
      method: 'POST',
      requiresAuth: false,
      url: '/auth/verify-registration',
    });
  });

  it('treats an empty resend response as a successful public request', async () => {
    jest.mocked(requester.request).mockResolvedValueOnce({
      isError: false,
      message: '',
    });

    const response = await resendRegistrationCode({ email: 'alex@example.com' });

    expect(response).toEqual({
      isError: false,
      message: '',
    });
    expect(requester.request).toHaveBeenCalledWith({
      data: { email: 'alex@example.com' },
      method: 'POST',
      requiresAuth: false,
      url: '/auth/resend-registration-code',
    });
  });

  it('sends refresh without access-token attachment or recursive refresh', async () => {
    await refresh('refresh-token');

    expect(requester.request).toHaveBeenCalledWith({
      data: { refreshToken: 'refresh-token' },
      method: 'POST',
      requiresAuth: false,
      skipAuthRefresh: true,
      url: '/auth/refresh',
    });
  });

  it('keeps both password-recovery endpoints outside auth attachment and refresh', async () => {
    await forgotPassword({ email: 'alex@example.com' });
    await resetPassword({
      code: '012345',
      email: 'alex@example.com',
      newPassword: 'new-password',
    });

    expect(requester.request).toHaveBeenNthCalledWith(1, {
      data: { email: 'alex@example.com' },
      method: 'POST',
      requiresAuth: false,
      skipAuthRefresh: true,
      url: '/auth/forgot-password',
    });
    expect(requester.request).toHaveBeenNthCalledWith(2, {
      data: {
        code: '012345',
        email: 'alex@example.com',
        newPassword: 'new-password',
      },
      method: 'POST',
      requiresAuth: false,
      skipAuthRefresh: true,
      url: '/auth/reset-password',
    });
  });

  it('requests the current user with centralized refresh enabled by default', async () => {
    await getMe();

    expect(requester.request).toHaveBeenCalledWith({
      method: 'GET',
      skipAuthRefresh: false,
      url: '/auth/me',
    });
  });

  it('can disable centralized refresh for explicit session restoration', async () => {
    await getMeWithoutRefresh();

    expect(requester.request).toHaveBeenCalledWith({
      method: 'GET',
      skipAuthRefresh: true,
      url: '/auth/me',
    });
  });

  it('sends logout with only the refresh token', async () => {
    await logout('refresh-token');

    expect(requester.request).toHaveBeenCalledWith({
      data: { refreshToken: 'refresh-token' },
      method: 'POST',
      requiresAuth: false,
      skipAuthRefresh: true,
      url: '/auth/logout',
    });
  });
});
