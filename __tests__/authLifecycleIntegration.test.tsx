import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useAuthSessionLifecycle } from '@/hooks/useAuthSessionLifecycle';
import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { clearAuthSession } from '@/modules/auth/services/authStateService';
import { clearAuthenticatedResources } from '@/services/authenticatedResourcesService';
import { useAuthStore } from '@/storage/authStore';
import type { IUser } from '@/types/auth';

jest.mock('@/libs/storage/KeychainStorage', () => ({
  keychainStorage: {
    clearTokens: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@/services/authenticatedResourcesService', () => ({
  clearAuthenticatedResources: jest.fn().mockResolvedValue(undefined),
}));

const user: IUser = {
  createdAt: '2026-07-26T10:00:00.000Z',
  email: 'alex@example.com',
  fullName: 'Alex Morgan',
  id: 'user-1',
  isPremium: false,
  language: 'en',
  photoUrl: null,
  updatedAt: '2026-07-26T10:00:00.000Z',
};

describe('auth lifecycle integration', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    useAuthSessionLifecycle();

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    renderer = undefined;
    useAuthStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user,
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
      useAuthStore.setState({
        isAuthorized: false,
        isSessionRestored: false,
        user: null,
      });
    });
  });

  it('runs authenticated resource cleanup once after local auth clearing', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    await ReactTestRenderer.act(async () => {
      await clearAuthSession();
    });

    expect(keychainStorage.clearTokens).toHaveBeenCalledTimes(1);
    expect(clearAuthenticatedResources).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });
});
