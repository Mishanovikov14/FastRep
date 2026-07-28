import type {
  IAuthenticationResponse,
  IForgotPasswordRequest,
  ILoginRequest,
  ILogoutRequest,
  IRefreshRequest,
  IRegisterRequest,
  IResetPasswordRequest,
  ITokenPair,
} from '@/entities/user/types/auth';
import type { IUser } from '@/entities/user/types/user';
import type { IResponse } from '@/libs/requester/IResponse';
import { requester } from '@/libs/requester/requester';

const requestCurrentUser = (skipAuthRefresh: boolean): Promise<IResponse<IUser>> => {
  return requester.request<IUser>({
    method: 'GET',
    skipAuthRefresh,
    url: '/auth/me',
  });
};

export const register = (request: IRegisterRequest): Promise<IResponse<IAuthenticationResponse>> => {
  return requester.request<IAuthenticationResponse>({
    data: request,
    method: 'POST',
    requiresAuth: false,
    url: '/auth/register',
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
