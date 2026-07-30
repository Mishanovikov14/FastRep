import { create } from 'zustand';

import { APP_ENVIRONMENTS, getDefaultAppEnvironmentKey } from '../config/appEnvironments';
import type { AppEnvironmentKey, IAppEnvironment } from '../types/appEnvironment';

interface AppEnvironmentState {
  activeEnvironment: IAppEnvironment;
  isSwitching: boolean;
  setActiveEnvironment(key: AppEnvironmentKey): void;
  setIsSwitching(value: boolean): void;
}

export const useAppEnvironmentStore = create<AppEnvironmentState>((set) => ({
  activeEnvironment: APP_ENVIRONMENTS[getDefaultAppEnvironmentKey(__DEV__)],
  isSwitching: false,
  setActiveEnvironment: (key) => {
    set({ activeEnvironment: APP_ENVIRONMENTS[key] });
  },
  setIsSwitching: (value) => {
    set({ isSwitching: value });
  },
}));
