import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useUserStore } from '@/entities/user/model/userStore';
import { clearAuthenticatedResources } from '@/entities/user/services/authenticatedResourcesService';
import { clearUserSession } from '@/entities/user/services/userStateService';
import { userTokenStorage } from '@/entities/user/services/userTokenStorage';
import type { IUser } from '@/entities/user/types/user';
import { useAuthSessionLifecycle } from '@/hooks/useAuthSessionLifecycle';

jest.mock('@/entities/user/services/userTokenStorage', () => ({
  userTokenStorage: {
    clearTokens: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@/entities/user/services/authenticatedResourcesService', () => ({
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
    useUserStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user,
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
      useUserStore.setState({
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
      await clearUserSession();
    });

    expect(userTokenStorage.clearTokens).toHaveBeenCalledTimes(1);
    expect(clearAuthenticatedResources).toHaveBeenCalledTimes(1);
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      isSessionRestored: true,
      user: null,
    });
  });
});
