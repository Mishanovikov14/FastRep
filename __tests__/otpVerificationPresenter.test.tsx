import { useNavigation, useRoute } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { forgotPassword } from '@/entities/user/API/userApi';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import { useOtpVerificationViewPresenter } from '@/modules/auth/ui/OtpVerificationView/presenters/useOtpVerificationViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
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

const t = ((key: string, options?: { seconds?: number }) =>
  options?.seconds === undefined ? key : `${key}:${options.seconds}`) as unknown as TFunction;

describe('useOtpVerificationViewPresenter', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };
  let presenter: ReturnType<typeof useOtpVerificationViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useOtpVerificationViewPresenter({ t });

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.mocked(useNavigation).mockReturnValue(navigation as never);
    jest.mocked(useRoute).mockReturnValue({
      params: {
        email: 'alex@example.com',
      },
    } as never);
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    jest.useRealTimers();
  });

  it('passes only normalized email and the six-digit string to ResetPassword', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeCode('012345');
    });
    ReactTestRenderer.act(() => {
      presenter?.onContinue();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ResetPassword', {
      code: '012345',
      email: 'alex@example.com',
    });
  });

  it('rejects non-numeric input without replacing the current OTP', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeCode('012345');
      presenter?.onChangeCode('012a45');
    });

    expect(presenter?.code).toBe('012345');
    expect(presenter?.codeError).toBe('auth.otp.invalidCodeFormat');
  });

  it('resends once, clears the old OTP, and runs a 60-second local cooldown', async () => {
    let resolveResponse: ((response: IResponse<void>) => void) | undefined;
    const responsePromise = new Promise<IResponse<void>>((resolve) => {
      resolveResponse = resolve;
    });

    jest.mocked(forgotPassword).mockReturnValue(responsePromise);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeCode('012345');
    });

    let firstResend: Promise<void> | undefined;

    ReactTestRenderer.act(() => {
      firstResend = presenter?.onResend();
      presenter?.onResend();
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
      await firstResend;
    });

    expect(presenter).toMatchObject({
      code: '',
      isResendDisabled: true,
      resendSeconds: 60,
    });
    expect(toastService.showSuccess).toHaveBeenCalledWith('auth.otp.codeResent');

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(presenter?.resendSeconds).toBe(59);
  });

  it('cleans up the active cooldown timer on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');

    jest.mocked(forgotPassword).mockResolvedValue({
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
    await ReactTestRenderer.act(async () => {
      await presenter?.onResend();
    });

    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    renderer = undefined;

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
