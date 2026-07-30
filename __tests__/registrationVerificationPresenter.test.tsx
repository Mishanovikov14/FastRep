import { useNavigation, useRoute } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { resendRegistrationCode, verifyRegistration } from '@/entities/user/API/userApi';
import { applyAuthenticationResponse } from '@/entities/user/services/userSessionService';
import type { IAuthenticationResponse } from '@/entities/user/types/auth';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import { useRegistrationVerificationViewPresenter } from '@/modules/auth/ui/RegistrationVerificationView/presenters/useRegistrationVerificationViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
jest.mock('@/entities/user/API/userApi', () => ({
  resendRegistrationCode: jest.fn(),
  verifyRegistration: jest.fn(),
}));
jest.mock('@/entities/user/services/userSessionService', () => ({
  applyAuthenticationResponse: jest.fn(),
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  },
}));

const t = ((key: string, options?: { time?: string }) =>
  options?.time === undefined ? key : `${key}:${options.time}`) as unknown as TFunction;

const authentication: IAuthenticationResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    createdAt: '2026-07-28T10:00:00.000Z',
    email: 'alex@example.com',
    fullName: 'Alex Morgan',
    id: 'user-1',
    isPremium: false,
    language: 'en',
    photoUrl: null,
    updatedAt: '2026-07-28T10:00:00.000Z',
  },
};

describe('useRegistrationVerificationViewPresenter', () => {
  const navigation = {
    goBack: jest.fn(),
  };
  let appStateListener: ((state: string) => void) | undefined;
  let presenter: ReturnType<typeof useRegistrationVerificationViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useRegistrationVerificationViewPresenter({ t });

    return null;
  };

  const renderPresenter = async (resendAvailableInSeconds = 0) => {
    jest.mocked(useRoute).mockReturnValue({
      params: {
        email: 'alex@example.com',
        resendAvailableInSeconds,
      },
    } as never);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-28T10:00:00.000Z'));
    appStateListener = undefined;
    presenter = undefined;
    renderer = undefined;
    jest.mocked(useNavigation).mockReturnValue(navigation as never);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      appStateListener = listener as (state: string) => void;

      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('uses the initial countdown and enables resend when the timestamp is reached', async () => {
    await renderPresenter(42);

    expect(presenter).toMatchObject({
      isResendDisabled: true,
      resendLabel: 'auth.registrationVerification.resendIn:00:42',
      resendSeconds: 42,
    });

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(42_000);
    });

    expect(presenter).toMatchObject({
      isResendDisabled: false,
      resendSeconds: 0,
    });
  });

  it('recalculates the countdown from its target timestamp after app resume', async () => {
    await renderPresenter(60);

    jest.setSystemTime(new Date('2026-07-28T10:00:45.000Z'));
    ReactTestRenderer.act(() => {
      appStateListener?.('active');
    });

    expect(presenter?.resendSeconds).toBe(15);
  });

  it('accepts only six digits, shows an inline error, and clears it when edited', async () => {
    await renderPresenter();

    ReactTestRenderer.act(() => {
      presenter?.onChangeCode('12a34567');
    });
    expect(presenter?.code).toBe('123456');

    ReactTestRenderer.act(() => {
      presenter?.onChangeCode('12345');
    });
    await ReactTestRenderer.act(async () => {
      await presenter?.onSubmit();
    });
    expect(presenter?.codeError).toBe('auth.registrationVerification.invalidCodeFormat');

    ReactTestRenderer.act(() => {
      presenter?.onChangeCode('123456');
    });
    expect(presenter?.codeError).toBeUndefined();

    jest.mocked(verifyRegistration).mockResolvedValue({
      isError: true,
      message: 'Invalid or expired registration verification code',
      status: 400,
    });
    await ReactTestRenderer.act(async () => {
      await presenter?.onSubmit();
    });
    expect(presenter?.codeError).toBe('auth.registrationVerification.invalidCode');
    expect(toastService.showError).not.toHaveBeenCalled();
  });

  it('applies the shared session once and prevents duplicate verification submits', async () => {
    let resolveResponse: ((response: IResponse<IAuthenticationResponse>) => void) | undefined;
    const responsePromise = new Promise<IResponse<IAuthenticationResponse>>((resolve) => {
      resolveResponse = resolve;
    });
    jest.mocked(verifyRegistration).mockReturnValue(responsePromise);
    jest.mocked(applyAuthenticationResponse).mockResolvedValue();
    await renderPresenter();

    ReactTestRenderer.act(() => {
      presenter?.onChangeCode('123456');
    });

    let firstSubmit: Promise<void> | undefined;
    ReactTestRenderer.act(() => {
      firstSubmit = presenter?.onSubmit();
      presenter?.onSubmit();
    });

    expect(verifyRegistration).toHaveBeenCalledTimes(1);
    expect(verifyRegistration).toHaveBeenCalledWith({
      code: '123456',
      email: 'alex@example.com',
    });

    resolveResponse?.({
      data: authentication,
      isError: false,
      message: '',
    });
    await ReactTestRenderer.act(async () => {
      await firstSubmit;
    });

    expect(applyAuthenticationResponse).toHaveBeenCalledTimes(1);
    expect(applyAuthenticationResponse).toHaveBeenCalledWith(authentication);
  });

  it('restarts cooldown after a successful 204 resend and uses backend timing for cooldown errors', async () => {
    jest
      .mocked(resendRegistrationCode)
      .mockResolvedValueOnce({
        isError: false,
        message: '',
      })
      .mockResolvedValueOnce({
        code: 'REGISTRATION_CODE_COOLDOWN',
        isError: true,
        message: 'Wait',
        retryAfterSeconds: 23,
        status: 429,
      });
    await renderPresenter();

    await ReactTestRenderer.act(async () => {
      await presenter?.onResend();
    });

    expect(presenter?.resendSeconds).toBe(60);
    expect(toastService.showSuccess).toHaveBeenCalledWith('auth.registrationVerification.codeResent');

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(60_000);
    });
    await ReactTestRenderer.act(async () => {
      await presenter?.onResend();
    });

    expect(presenter?.resendSeconds).toBe(23);
    expect(toastService.showError).not.toHaveBeenCalled();
  });

  it('keeps resend disabled during cooldown and returns to registration on back', async () => {
    await renderPresenter(30);

    await ReactTestRenderer.act(async () => {
      await presenter?.onResend();
    });
    ReactTestRenderer.act(() => {
      presenter?.onBack();
    });

    expect(resendRegistrationCode).not.toHaveBeenCalled();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
