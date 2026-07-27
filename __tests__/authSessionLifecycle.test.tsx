import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useAuthSessionLifecycle } from '@/hooks/useAuthSessionLifecycle';
import { clearAuthenticatedResources } from '@/services/authenticatedResourcesService';
import { useAuthStore } from '@/storage/authStore';
import type { IUser } from '@/types/auth';

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

describe('useAuthSessionLifecycle', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    useAuthSessionLifecycle();

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    renderer = undefined;
    useAuthStore.setState({
      isAuthorized: false,
      isSessionRestored: false,
      user: null,
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

  it('cleans only once for each authorized to unauthorized transition', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(clearAuthenticatedResources).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      useAuthStore.getState().clearUser();
    });

    expect(clearAuthenticatedResources).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      useAuthStore.getState().setUser(user);
    });
    await ReactTestRenderer.act(async () => {
      useAuthStore.getState().clearUser();
    });
    await ReactTestRenderer.act(async () => {
      useAuthStore.getState().clearUser();
    });

    expect(clearAuthenticatedResources).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(async () => {
      useAuthStore.getState().setUser(user);
    });
    await ReactTestRenderer.act(async () => {
      useAuthStore.getState().clearUser();
    });

    expect(clearAuthenticatedResources).toHaveBeenCalledTimes(2);
  });
});
