import { useNavigation } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import type { IResponse } from '@/libs/requester/IResponse';
import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { register } from '@/modules/auth/API/register';
import type { RegisterResponse } from '@/modules/auth/types/registration';
import { useRegistrationViewPresenter } from '@/modules/auth/ui/RegistrationView/presenters/useRegistrationViewPresenter';
import { useAuthStore } from '@/storage/authStore';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
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
jest.mock('@/modules/auth/API/register', () => ({
  register: jest.fn(),
}));

const t = ((key: string) => key) as unknown as TFunction;

describe('useRegistrationViewPresenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().clearUser();
  });

  it('blocks duplicate submits and completes the authenticated registration flow', async () => {
    const navigation = {
      reset: jest.fn(),
    };
    let presenter: ReturnType<typeof useRegistrationViewPresenter> | undefined;
    let resolveResponse: ((response: IResponse<RegisterResponse>) => void) | undefined;
    const responsePromise = new Promise<IResponse<RegisterResponse>>((resolve) => {
      resolveResponse = resolve;
    });
    const Harness = () => {
      presenter = useRegistrationViewPresenter({
        language: 'en',
        t,
      });

      return null;
    };

    jest.mocked(useNavigation).mockReturnValue(navigation);
    jest.mocked(register).mockReturnValue(responsePromise);
    jest.mocked(keychainStorage.saveTokens).mockResolvedValue();

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeName('Alex Morgan');
      presenter?.onChangeEmail('alex@example.com');
      presenter?.onChangePassword('password123');
      presenter?.onChangeConfirmPassword('password123');
    });

    let firstSubmit: Promise<void> | undefined;
    let duplicateSubmit: Promise<void> | undefined;

    ReactTestRenderer.act(() => {
      firstSubmit = presenter?.onRegister();
      duplicateSubmit = presenter?.onRegister();
    });

    expect(register).toHaveBeenCalledTimes(1);
    await duplicateSubmit;

    resolveResponse?.({
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          createdAt: '2026-07-26T10:00:00.000Z',
          email: 'alex@example.com',
          fullName: 'Alex Morgan',
          id: 'user-1',
          isPremium: false,
          language: 'en',
          photoUrl: null,
          updatedAt: '2026-07-26T10:00:00.000Z',
        },
      },
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await firstSubmit;
    });

    expect(keychainStorage.saveTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(useAuthStore.getState()).toMatchObject({
      isAuthorized: true,
      user: {
        email: 'alex@example.com',
        id: 'user-1',
      },
    });
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });
});
