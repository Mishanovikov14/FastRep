import { useNavigation, useRoute } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { resetPassword } from '@/entities/user/API/userApi';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import { useResetPasswordViewPresenter } from '@/modules/auth/ui/ResetPasswordView/presenters/useResetPasswordViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
jest.mock('@/entities/user/API/userApi', () => ({
  resetPassword: jest.fn(),
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  },
}));

const t = ((key: string) => key) as unknown as TFunction;

describe('useResetPasswordViewPresenter', () => {
  const navigation = {
    goBack: jest.fn(),
    reset: jest.fn(),
  };
  let presenter: ReturnType<typeof useResetPasswordViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useResetPasswordViewPresenter({ t });

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useNavigation).mockReturnValue(navigation as never);
    jest.mocked(useRoute).mockReturnValue({
      params: {
        code: '012345',
        email: 'alex@example.com',
      },
    } as never);
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  });

  it('submits once, clears sensitive fields, and removes recovery history', async () => {
    let resolveResponse: ((response: IResponse<void>) => void) | undefined;
    const responsePromise = new Promise<IResponse<void>>((resolve) => {
      resolveResponse = resolve;
    });

    jest.mocked(resetPassword).mockReturnValue(responsePromise);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangePassword('new-password');
      presenter?.onChangeConfirmPassword('new-password');
    });

    let firstSubmit: Promise<void> | undefined;

    ReactTestRenderer.act(() => {
      firstSubmit = presenter?.onSubmit();
      presenter?.onSubmit();
    });

    expect(resetPassword).toHaveBeenCalledTimes(1);
    expect(resetPassword).toHaveBeenCalledWith({
      code: '012345',
      email: 'alex@example.com',
      newPassword: 'new-password',
    });

    resolveResponse?.({
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await firstSubmit;
    });

    expect(presenter).toMatchObject({
      confirmPassword: '',
      password: '',
    });
    expect(toastService.showSuccess).toHaveBeenCalledWith(
      'common.success',
      'auth.resetPassword.success',
    );
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  });

  it('maps an invalid code safely and remains on ResetPassword', async () => {
    jest.mocked(resetPassword).mockResolvedValue({
      isError: true,
      message: 'Database-specific invalid reset secret',
      status: 400,
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangePassword('new-password');
      presenter?.onChangeConfirmPassword('new-password');
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onSubmit();
    });

    expect(navigation.reset).not.toHaveBeenCalled();
    expect(presenter).toMatchObject({
      confirmPassword: 'new-password',
      password: 'new-password',
    });
    expect(toastService.showError).toHaveBeenCalledWith(
      'common.error',
      'auth.recovery.invalidOrExpiredCode',
    );
  });
});
