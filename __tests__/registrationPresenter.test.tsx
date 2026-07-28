import { useNavigation } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { register } from '@/entities/user/API/userApi';
import { useUserStore } from '@/entities/user/model/userStore';
import { userTokenStorage } from '@/entities/user/services/userTokenStorage';
import type { IAuthenticationResponse } from '@/entities/user/types/auth';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import { useRegistrationViewPresenter } from '@/modules/auth/ui/RegistrationView/presenters/useRegistrationViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));
jest.mock('@/entities/user/services/userTokenStorage', () => ({
  userTokenStorage: {
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
jest.mock('@/entities/user/API/userApi', () => ({
  register: jest.fn(),
}));

const t = ((key: string) => key) as unknown as TFunction;

describe('useRegistrationViewPresenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.getState().clearUser();
  });

  it('blocks duplicate submits and completes the authenticated registration flow', async () => {
    const navigation = {
      navigate: jest.fn(),
      reset: jest.fn(),
    };
    let presenter: ReturnType<typeof useRegistrationViewPresenter> | undefined;
    let resolveResponse: ((response: IResponse<IAuthenticationResponse>) => void) | undefined;
    const responsePromise = new Promise<IResponse<IAuthenticationResponse>>((resolve) => {
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
    jest.mocked(userTokenStorage.saveTokens).mockResolvedValue();

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

    expect(userTokenStorage.saveTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: true,
      user: {
        email: 'alex@example.com',
        id: 'user-1',
      },
    });
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('does not save or authorize a session after a failed registration', async () => {
    const navigation = {
      navigate: jest.fn(),
    };
    let presenter: ReturnType<typeof useRegistrationViewPresenter> | undefined;
    const Harness = () => {
      presenter = useRegistrationViewPresenter({
        language: 'en',
        t,
      });

      return null;
    };

    jest.mocked(useNavigation).mockReturnValue(navigation as never);
    jest.mocked(register).mockResolvedValue({
      isError: true,
      message: 'Email already exists',
      status: 409,
    });
    jest.mocked(userTokenStorage.saveTokens).mockResolvedValue();

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeName('Alex Morgan');
      presenter?.onChangeEmail('alex@example.com');
      presenter?.onChangePassword('password123');
      presenter?.onChangeConfirmPassword('password123');
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onRegister();
    });

    expect(userTokenStorage.saveTokens).not.toHaveBeenCalled();
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      user: null,
    });
    expect(toastService.showError).toHaveBeenCalledWith('common.error', 'Email already exists');
  });

  it('navigates back to Login without making a registration request', async () => {
    const navigation = {
      goBack: jest.fn(),
    };
    let presenter: ReturnType<typeof useRegistrationViewPresenter> | undefined;
    const Harness = () => {
      presenter = useRegistrationViewPresenter({
        language: 'en',
        t,
      });

      return null;
    };

    jest.mocked(useNavigation).mockReturnValue(navigation as never);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onLogin();
    });

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(register).not.toHaveBeenCalled();
    expect(userTokenStorage.saveTokens).not.toHaveBeenCalled();
  });
});
