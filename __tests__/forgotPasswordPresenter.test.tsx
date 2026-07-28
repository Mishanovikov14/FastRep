import { useNavigation } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { forgotPassword } from '@/entities/user/API/userApi';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import { useForgotPasswordViewPresenter } from '@/modules/auth/ui/ForgotPasswordView/presenters/useForgotPasswordViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));
jest.mock('@/entities/user/API/userApi', () => ({
  forgotPassword: jest.fn(),
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  },
}));

const t = ((key: string) => key) as unknown as TFunction;

describe('useForgotPasswordViewPresenter', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };
  let presenter: ReturnType<typeof useForgotPasswordViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useForgotPasswordViewPresenter({ t });

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useNavigation).mockReturnValue(navigation as never);
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  });

  it('normalizes email, prevents duplicate submit, and navigates after generic success', async () => {
    let resolveResponse: ((response: IResponse<void>) => void) | undefined;
    const responsePromise = new Promise<IResponse<void>>((resolve) => {
      resolveResponse = resolve;
    });

    jest.mocked(forgotPassword).mockReturnValue(responsePromise);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeEmail('  ALEX@EXAMPLE.COM ');
    });

    let firstSubmit: Promise<void> | undefined;

    ReactTestRenderer.act(() => {
      firstSubmit = presenter?.onSubmit();
      presenter?.onSubmit();
    });

    expect(forgotPassword).toHaveBeenCalledTimes(1);
    expect(forgotPassword).toHaveBeenCalledWith({
      email: 'alex@example.com',
    });

    resolveResponse?.({
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await firstSubmit;
    });

    expect(toastService.showSuccess).toHaveBeenCalledWith('common.success', 'auth.forgotPassword.codeSent');
    expect(navigation.navigate).toHaveBeenCalledWith('OtpVerification', {
      email: 'alex@example.com',
    });
  });

  it('keeps the user on the screen and maps rate limiting safely', async () => {
    jest.mocked(forgotPassword).mockResolvedValue({
      isError: true,
      message: 'Internal provider details',
      status: 429,
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeEmail('alex@example.com');
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onSubmit();
    });

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(toastService.showError).toHaveBeenCalledWith('common.error', 'auth.recovery.rateLimited');
  });
});
