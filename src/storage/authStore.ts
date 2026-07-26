import { create } from 'zustand';

import type { User } from '@/modules/auth/models/User';

interface AuthState {
  clearUser(): void;
  isAuthorized: boolean;
  setUser(user: User): void;
  user: User | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  clearUser: () => {
    set({
      isAuthorized: false,
      user: null,
    });
  },
  isAuthorized: false,
  setUser: (user) => {
    set({
      isAuthorized: true,
      user,
    });
  },
  user: null,
}));
