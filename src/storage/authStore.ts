import { create } from 'zustand';

import type { IUser } from '@/types/auth';

interface AuthState {
  clearUser(): void;
  isAuthorized: boolean;
  isSessionRestored: boolean;
  resetAuth(): void;
  setSessionRestored(value: boolean): void;
  setUser(user: IUser): void;
  user: IUser | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  clearUser: () => {
    set({
      isAuthorized: false,
      user: null,
    });
  },
  isAuthorized: false,
  isSessionRestored: false,
  resetAuth: () => {
    set({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  },
  setSessionRestored: (value) => {
    set({ isSessionRestored: value });
  },
  setUser: (user) => {
    set({
      isAuthorized: true,
      user,
    });
  },
  user: null,
}));
