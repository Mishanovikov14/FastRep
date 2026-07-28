import { useNavigation } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { register } from '@/entities/user/API/userApi';
import { useUserStore } from '@/entities/user/model/userStore';
import type { IRegistrationPendingResponse } from '@/entities/user/types/auth';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import { useRegistrationViewPresenter } from '@/modules/auth/ui/RegistrationView/presenters/useRegistrationViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
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

  it('blocks duplicate submits and navigates to verification without authenticating', async () => {
    const navigation = {
      navigate: jest.fn(),
      reset: jest.fn(),
    };
    let presenter: ReturnType<typeof useRegistrationViewPresenter> | undefined;
    let resolveResponse: ((response: IResponse<IRegistrationPendingResponse>) => void) | undefined;
    const responsePromise = new Promise<IResponse<IRegistrationPendingResponse>>((resolve) => {
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
        email: 'alex@example.com',
        resendAvailableInSeconds: 57,
        verificationRequired: true,
      },
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await firstSubmit;
    });

    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      user: null,
    });
    expect(navigation.navigate).toHaveBeenCalledWith('RegistrationVerification', {
      email: 'alex@example.com',
      resendAvailableInSeconds: 57,
    });
    expect(navigation.navigate.mock.calls[0]?.[1]).not.toHaveProperty('password');
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

    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      user: null,
    });
    expect(toastService.showError).toHaveBeenCalledWith(
      'common.error',
      'auth.registrationVerification.accountAlreadyExists',
    );
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
  });
});
