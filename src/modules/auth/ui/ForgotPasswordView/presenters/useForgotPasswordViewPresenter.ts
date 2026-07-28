import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';

import { forgotPassword } from '@/entities/user/API/userApi';
import { toastService } from '@/libs/toast/toastService';
import { getForgotPasswordErrorMessage } from '@/modules/auth/presenters/passwordRecoveryErrors';
import type { GuestStackParamList } from '@/navigation/types';

import type { ForgotPasswordFormErrors, IPresenterInput } from '../types';
import { normalizeForgotPasswordRequest, validateForgotPassword } from './forgotPasswordValidation';

export const useForgotPasswordViewPresenter = ({ t }: IPresenterInput) => {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList, 'ForgotPassword'>>();
  const isSubmittingRef = useRef(false);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const onChangeEmail = useCallback((value: string) => {
    setEmail(value);
    setErrors({});
  }, []);

  const onBackToLogin = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onSubmit = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const nextErrors = validateForgotPassword({ email }, t);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const request = normalizeForgotPasswordRequest({ email });

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const response = await forgotPassword(request);

      if (response.isError) {
        toastService.showError(String(t('common.error')), getForgotPasswordErrorMessage(response, t));
        return;
      }

      toastService.showSuccess(String(t('common.success')), String(t('auth.forgotPassword.codeSent')));
      navigation.navigate('OtpVerification', {
        email: request.email,
      });
    } catch {
      console.error('Unexpected forgot-password failure');
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }, [email, navigation, t]);

  return {
    email,
    emailError: errors.email,
    isLoading,
    onBackToLogin,
    onChangeEmail,
    onSubmit,
  };
};
