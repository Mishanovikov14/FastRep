import type { SupportedLanguage } from '@/localization/types';

import type { IUser } from './user';

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthenticationResponse extends ITokenPair {
  user: IUser;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IRegisterRequest {
  email: string;
  fullName: string;
  language: SupportedLanguage;
  password: string;
}

export interface IResetPasswordRequest {
  code: string;
  email: string;
  newPassword: string;
}

export interface IRefreshRequest {
  refreshToken: string;
}

export interface ILogoutRequest {
  refreshToken: string;
}
