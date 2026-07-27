import type { SupportedLanguage } from '@/localization/types';

export interface IUser {
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  isPremium: boolean;
  language: SupportedLanguage;
  photoUrl: string | null;
  updatedAt: string;
}

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

export interface IRegisterRequest {
  email: string;
  fullName: string;
  language: SupportedLanguage;
  password: string;
}

export interface IRefreshRequest {
  refreshToken: string;
}

export interface ILogoutRequest {
  refreshToken: string;
}

export type SessionRestoreResult =
  | {
      status: 'authorized';
      user: IUser;
    }
  | {
      status: 'unauthorized';
    }
  | {
      message?: string;
      status: 'temporary_error';
      statusCode?: number;
      type?: string;
    };
