import { create } from 'zustand';

import type { IUser } from '@/entities/user/types/user';

interface UserState {
  clearUser(): void;
  isAuthorized: boolean;
  isSessionRestored: boolean;
  resetUser(): void;
  setSessionRestored(value: boolean): void;
  setUser(user: IUser): void;
  user: IUser | null;
}

export const useUserStore = create<UserState>((set) => ({
  clearUser: () => {
    set({
      isAuthorized: false,
      user: null,
    });
  },
  isAuthorized: false,
  isSessionRestored: false,
  resetUser: () => {
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
