import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';

import { forgotPassword } from '@/entities/user/API/userApi';
import { toastService } from '@/libs/toast/toastService';
import { getForgotPasswordErrorMessage } from '@/modules/auth/presenters/passwordRecoveryErrors';
import type { GuestStackParamList } from '@/navigation/types';

import type { IPresenterInput, OtpFormErrors } from '../types';
import { isValidOtpInput, validateOtp } from './otpValidation';

const RESEND_COOLDOWN_SECONDS = 60;

export const useOtpVerificationViewPresenter = ({ t }: IPresenterInput) => {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList, 'OtpVerification'>>();
  const route = useRoute<RouteProp<GuestStackParamList, 'OtpVerification'>>();
  const isResendingRef = useRef(false);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<OtpFormErrors>({});
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const { email } = route.params;

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => {
      clearInterval(timer);
    };
  }, [resendSeconds]);

  const onChangeCode = useCallback(
    (value: string) => {
      if (!isValidOtpInput(value)) {
        setErrors({
          code: String(t('auth.otp.invalidCodeFormat')),
        });
        return;
      }

      setCode(value);
      setErrors({});
    },
    [t],
  );

  const onContinue = useCallback(() => {
    const codeError = validateOtp(code, t);

    setErrors({
      code: codeError,
    });

    if (codeError) {
      return;
    }

    navigation.navigate('ResetPassword', {
      code,
      email,
    });
  }, [code, email, navigation, t]);

  const onResend = useCallback(async () => {
    if (isResendingRef.current || resendSeconds > 0) {
      return;
    }

    isResendingRef.current = true;
    setIsResending(true);

    try {
      const response = await forgotPassword({ email });

      if (response.isError) {
        if (response.status === 429) {
          setResendSeconds((current) => (current > 0 ? current : RESEND_COOLDOWN_SECONDS));
        }

        toastService.showError(String(t('common.error')), getForgotPasswordErrorMessage(response, t));
        return;
      }

      setCode('');
      setErrors({});
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      toastService.showSuccess(String(t('auth.otp.codeResent')));
    } catch {
      console.error('Unexpected password-code resend failure');
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isResendingRef.current = false;
      setIsResending(false);
    }
  }, [email, resendSeconds, t]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    code,
    codeError: errors.code,
    email,
    isResendDisabled: isResending || resendSeconds > 0,
    isResending,
    onBack,
    onChangeCode,
    onContinue,
    onResend,
    resendLabel:
      resendSeconds > 0 ? String(t('auth.otp.resendIn', { seconds: resendSeconds })) : String(t('auth.otp.resendCode')),
    resendSeconds,
  };
};
