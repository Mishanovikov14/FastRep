import type { SupportedLanguage } from '@/localization/types';
import type { User } from '@/modules/auth/models/User';

export interface RegisterRequest {
  email: string;
  fullName: string;
  language: SupportedLanguage;
  password: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
