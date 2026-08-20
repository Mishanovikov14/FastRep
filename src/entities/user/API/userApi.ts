import type {
  IAuthenticationResponse,
  IForgotPasswordRequest,
  ILoginRequest,
  ILogoutRequest,
  IRefreshRequest,
  IRegisterRequest,
  IRegistrationPendingResponse,
  IResendRegistrationCodeRequest,
  IResetPasswordRequest,
  ITokenPair,
  IVerifyRegistrationRequest,
} from '@/entities/user/types/auth';
import type { IUpdateUserProfileRequest, IUser } from '@/entities/user/types/user';
import type { IResponse } from '@/libs/requester/IResponse';
import { requester } from '@/libs/requester/requester';

const requestCurrentUser = (skipAuthRefresh: boolean): Promise<IResponse<IUser>> => {
  return requester.request<IUser>({
    method: 'GET',
    skipAuthRefresh,
    url: '/auth/me',
  });
};

export const register = (request: IRegisterRequest): Promise<IResponse<IRegistrationPendingResponse>> => {
  return requester.request<IRegistrationPendingResponse>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    url: '/auth/register',
  });
};

export const verifyRegistration = (
  request: IVerifyRegistrationRequest,
): Promise<IResponse<IAuthenticationResponse>> => {
  return requester.request<IAuthenticationResponse>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    url: '/auth/verify-registration',
  });
};

export const resendRegistrationCode = (request: IResendRegistrationCodeRequest): Promise<IResponse<void>> => {
  return requester.request<void>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    url: '/auth/resend-registration-code',
  });
};

export const login = (request: ILoginRequest): Promise<IResponse<IAuthenticationResponse>> => {
  return requester.request<IAuthenticationResponse>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    url: '/auth/login',
  });
};

export const forgotPassword = (request: IForgotPasswordRequest): Promise<IResponse<void>> => {
  return requester.request<void>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    skipAuthRefresh: true,
    url: '/auth/forgot-password',
  });
};

export const resetPassword = (request: IResetPasswordRequest): Promise<IResponse<void>> => {
  return requester.request<void>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    skipAuthRefresh: true,
    url: '/auth/reset-password',
  });
};

export const refresh = (refreshToken: string): Promise<IResponse<ITokenPair>> => {
  const request: IRefreshRequest = { refreshToken };

  return requester.request<ITokenPair>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    skipAuthRefresh: true,
    url: '/auth/refresh',
  });
};

export const getMe = (): Promise<IResponse<IUser>> => {
  return requestCurrentUser(false);
};

export const getMeWithoutRefresh = (): Promise<IResponse<IUser>> => {
  return requestCurrentUser(true);
};

export const updateProfile = (request: IUpdateUserProfileRequest): Promise<IResponse<IUser>> => {
  return requester.request<IUser>({
    data: request,
    method: 'PATCH',
    url: '/auth/me',
  });
};

export const logout = (refreshToken: string): Promise<IResponse<void>> => {
  const request: ILogoutRequest = { refreshToken };

  return requester.request<void>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    skipAuthRefresh: true,
    url: '/auth/logout',
  });
};
