import type { SupportedLanguage } from '@/localization/types';

export interface IUser {
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  isPremium: boolean;
  language: SupportedLanguage;
  photoUrl: string | null;
  timezone?: string | null;
  updatedAt: string;
}

export interface IUpdateUserProfileRequest {
  timezone?: string | null;
}
