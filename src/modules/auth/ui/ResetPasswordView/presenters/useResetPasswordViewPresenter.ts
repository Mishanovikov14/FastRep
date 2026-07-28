import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';

import { resetPassword } from '@/entities/user/API/userApi';
import { toastService } from '@/libs/toast/toastService';
import { getResetPasswordErrorMessage } from '@/modules/auth/presenters/passwordRecoveryErrors';
import type { GuestStackParamList } from '@/navigation/types';

import type { IPresenterInput, ResetPasswordFormErrors } from '../types';
import { validateResetPassword } from './resetPasswordValidation';

export const useResetPasswordViewPresenter = ({ t }: IPresenterInput) => {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList, 'ResetPassword'>>();
  const route = useRoute<RouteProp<GuestStackParamList, 'ResetPassword'>>();
  const isSubmittingRef = useRef(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const { code, email } = route.params;

  const onChangePassword = useCallback((value: string) => {
    setPassword(value);
    setErrors((current) => ({
      ...current,
      confirmPassword: undefined,
      password: undefined,
    }));
  }, []);

  const onChangeConfirmPassword = useCallback((value: string) => {
    setConfirmPassword(value);
    setErrors((current) => ({
      ...current,
      confirmPassword: undefined,
    }));
  }, []);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onSubmit = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const nextErrors = validateResetPassword(
      {
        confirmPassword,
        password,
      },
      t,
    );

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const response = await resetPassword({
        code,
        email,
        newPassword: password,
      });

      if (response.isError) {
        toastService.showError(String(t('common.error')), getResetPasswordErrorMessage(response, t));
        return;
      }

      setConfirmPassword('');
      setPassword('');
      setErrors({});
      toastService.showSuccess(String(t('common.success')), String(t('auth.resetPassword.success')));
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch {
      console.error('Unexpected reset-password failure');
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }, [code, confirmPassword, email, navigation, password, t]);

  return {
    confirmPassword,
    errors,
    isLoading,
    onBack,
    onChangeConfirmPassword,
    onChangePassword,
    onSubmit,
    password,
  };
};
