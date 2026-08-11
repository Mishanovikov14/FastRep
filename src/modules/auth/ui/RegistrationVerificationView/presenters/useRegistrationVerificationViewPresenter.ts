import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { resendRegistrationCode, verifyRegistration } from '@/entities/user/API/userApi';
import { applyAuthenticationResponse } from '@/entities/user/services/userSessionService';
import { logger } from '@/libs/logger/logger';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import type { GuestStackParamList } from '@/navigation/types';

const CODE_LENGTH = 6;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const REGISTRATION_COOLDOWN_CODE = 'REGISTRATION_CODE_COOLDOWN';

type VerificationResponse = Pick<IResponse<unknown>, 'code' | 'status' | 'type'>;

const getRequestErrorMessage = (response: VerificationResponse, t: TFunction): string => {
  if (response.type === 'network_error') {
    return String(t('auth.registrationVerification.networkError'));
  }

  if (response.type === 'timeout_error' || response.status === 408) {
    return String(t('auth.registrationVerification.timeoutError'));
  }

  if (response.status === 503 || (response.status !== undefined && response.status >= 500)) {
    return String(t('auth.registrationVerification.serverUnavailable'));
  }

  if (response.status === 429) {
    return String(t('auth.registrationVerification.rateLimited'));
  }

  if (response.status === 409) {
    return String(t('auth.registrationVerification.accountAlreadyExists'));
  }

  return String(t('auth.registrationVerification.genericError'));
};

const getRemainingSeconds = (targetTime: number): number => {
  return Math.max(0, Math.ceil((targetTime - Date.now()) / 1_000));
};

const normalizeSeconds = (seconds: number): number => {
  return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : 0;
};

const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

interface IPresenterInput {
  t: TFunction;
}

export const useRegistrationVerificationViewPresenter = ({ t }: IPresenterInput) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<GuestStackParamList, 'RegistrationVerification'>>();
  const route = useRoute<RouteProp<GuestStackParamList, 'RegistrationVerification'>>();
  const initialSeconds = normalizeSeconds(route.params.resendAvailableInSeconds);
  const countdownTargetRef = useRef(Date.now() + initialSeconds * 1_000);
  const isResendingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(initialSeconds);
  const { email } = route.params;

  const onRecalculateCountdown = useCallback(() => {
    setResendSeconds(getRemainingSeconds(countdownTargetRef.current));
  }, []);

  const onStartCountdown = useCallback((seconds: number) => {
    const normalizedSeconds = normalizeSeconds(seconds);

    countdownTargetRef.current = Date.now() + normalizedSeconds * 1_000;
    setResendSeconds(normalizedSeconds);
  }, []);

  useEffect(() => {
    const interval = setInterval(onRecalculateCountdown, 1_000);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        onRecalculateCountdown();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [onRecalculateCountdown]);

  const onChangeCode = useCallback((value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
    setCodeError(undefined);
  }, []);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onSubmit = useCallback(async () => {
    if (isSubmittingRef.current || isResendingRef.current) {
      return;
    }

    if (code.length !== CODE_LENGTH) {
      setCodeError(String(t('auth.registrationVerification.invalidCodeFormat')));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await verifyRegistration({ code, email });

      if (response.isError || !response.data) {
        if (response.status === 400) {
          setCodeError(String(t('auth.registrationVerification.invalidCode')));
          return;
        }

        toastService.showError(String(t('common.error')), getRequestErrorMessage(response, t));
        return;
      }

      const authenticationResult = await applyAuthenticationResponse(response.data);

      if (authenticationResult === 'environment_reset') {
        toastService.showError(
          String(t('common.error')),
          String(t('auth.environment.productionRequired')),
        );
      }
    } catch {
      logger.error('auth.registration_verification_failed', { errorCode: 'unexpected_error' });
      toastService.showError(
        String(t('common.error')),
        String(t('auth.registrationVerification.genericError')),
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [code, email, t]);

  const onResend = useCallback(async () => {
    if (isResendingRef.current || isSubmittingRef.current || resendSeconds > 0) {
      return;
    }

    isResendingRef.current = true;
    setIsResending(true);

    try {
      const response = await resendRegistrationCode({ email });

      if (response.isError) {
        if (
          response.status === 429 &&
          response.code === REGISTRATION_COOLDOWN_CODE &&
          response.retryAfterSeconds !== undefined
        ) {
          onStartCountdown(response.retryAfterSeconds);
          return;
        }

        toastService.showError(String(t('common.error')), getRequestErrorMessage(response, t));
        return;
      }

      setCode('');
      setCodeError(undefined);
      onStartCountdown(DEFAULT_RESEND_COOLDOWN_SECONDS);
      toastService.showSuccess(String(t('auth.registrationVerification.codeResent')));
    } catch {
      logger.error('auth.registration_code_resend_failed', { errorCode: 'unexpected_error' });
      toastService.showError(
        String(t('common.error')),
        String(t('auth.registrationVerification.genericError')),
      );
    } finally {
      isResendingRef.current = false;
      setIsResending(false);
    }
  }, [email, onStartCountdown, resendSeconds, t]);

  return {
    code,
    codeError,
    email,
    isResendDisabled: isResending || resendSeconds > 0,
    isResending,
    isSubmitDisabled: code.length !== CODE_LENGTH || isResending || isSubmitting,
    isSubmitting,
    onBack,
    onChangeCode,
    onResend,
    onSubmit,
    resendLabel:
      resendSeconds > 0
        ? String(
            t('auth.registrationVerification.resendIn', {
              time: formatCountdown(resendSeconds),
            }),
          )
        : String(t('auth.registrationVerification.resend')),
    resendSeconds,
  };
};
