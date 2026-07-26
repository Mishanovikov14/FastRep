import { useMutation } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import type { IResponse } from '@/libs/requester/IResponse';
import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { toastService } from '@/libs/toast/toastService';
import { clearAuthSession } from '@/modules/auth/services/authStateService';
import { useHomeViewPresenter } from '@/modules/home/ui/HomeView/presenters/useHomeViewPresenter';
import { useAuthStore } from '@/storage/authStore';
import type { IUser } from '@/types/auth';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));
jest.mock('@/libs/storage/KeychainStorage', () => ({
  keychainStorage: {
    clearTokens: jest.fn(),
    getTokens: jest.fn(),
    saveTokens: jest.fn(),
  },
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: {
    showError: jest.fn(),
  },
}));
jest.mock('@/modules/auth/API/authApi', () => ({
  logout: jest.fn(),
}));
jest.mock('@/modules/auth/services/authStateService', () => ({
  clearAuthSession: jest.fn(),
}));

const t = ((key: string) => key) as unknown as TFunction;
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
const mockMutateAsync = jest.fn();

describe('useHomeViewPresenter', () => {
  let presenter: ReturnType<typeof useHomeViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useHomeViewPresenter({ t });

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    presenter = undefined;
    renderer = undefined;
    useAuthStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user,
    });
    jest.mocked(useMutation).mockReturnValue({
      isPending: false,
      mutateAsync: mockMutateAsync,
    } as never);
    jest.mocked(keychainStorage.getTokens).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    jest.mocked(clearAuthSession).mockResolvedValue();
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

  it('logs out remotely once and always clears the local auth session', async () => {
    let resolveResponse: ((response: IResponse<void>) => void) | undefined;
    const responsePromise = new Promise<IResponse<void>>((resolve) => {
      resolveResponse = resolve;
    });

    mockMutateAsync.mockReturnValue(responsePromise);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    let firstLogout: Promise<void> | undefined;
    let duplicateLogout: Promise<void> | undefined;

    ReactTestRenderer.act(() => {
      firstLogout = presenter?.onLogout();
      duplicateLogout = presenter?.onLogout();
    });

    await duplicateLogout;

    expect(keychainStorage.getTokens).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith('refresh-token');

    resolveResponse?.({
      isError: false,
      message: '',
      status: 204,
    });

    await ReactTestRenderer.act(async () => {
      await firstLogout;
    });

    expect(clearAuthSession).toHaveBeenCalledTimes(1);
    expect(toastService.showError).not.toHaveBeenCalled();
  });

  it('clears the local auth session and reports an error when backend logout fails', async () => {
    mockMutateAsync.mockResolvedValue({
      isError: true,
      message: 'Service unavailable',
      status: 503,
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onLogout();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith('refresh-token');
    expect(clearAuthSession).toHaveBeenCalledTimes(1);
    expect(toastService.showError).toHaveBeenCalledWith(
      'common.error',
      'home.logoutError',
    );
  });
});
