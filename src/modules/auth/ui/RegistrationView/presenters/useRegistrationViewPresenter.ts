import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';

import { register } from '@/entities/user/API/userApi';
import { toastService } from '@/libs/toast/toastService';
import type { IPresenterInput, RegistrationFormErrors } from '@/modules/auth/ui/RegistrationView/types';
import type { GuestStackParamList } from '@/navigation/types';

import { validateRegistration } from './registrationValidation';

interface IRequestFailure {
  status?: number;
  type?: string;
}

const getRegistrationErrorMessage = ({ status, type }: IRequestFailure, t: IPresenterInput['t']): string => {
  if (type === 'network_error') {
    return String(t('auth.registrationVerification.networkError'));
  }

  if (type === 'timeout_error' || status === 408) {
    return String(t('auth.registrationVerification.timeoutError'));
  }

  if (status === 503 || (status !== undefined && status >= 500)) {
    return String(t('auth.registrationVerification.serverUnavailable'));
  }

  if (status === 429) {
    return String(t('auth.registrationVerification.rateLimited'));
  }

  if (status === 409) {
    return String(t('auth.registrationVerification.accountAlreadyExists'));
  }

  return String(t('common.somethingWentWrong'));
};

export const useRegistrationViewPresenter = ({ language, t }: IPresenterInput) => {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList, 'Registration'>>();
  const isSubmittingRef = useRef(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<RegistrationFormErrors>({});
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const onChangeConfirmPassword = useCallback((value: string) => {
    setConfirmPassword(value);
    setErrors((current) => ({ ...current, confirmPassword: undefined }));
  }, []);

  const onChangeEmail = useCallback((value: string) => {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined }));
  }, []);

  const onChangeName = useCallback((value: string) => {
    setFullName(value);
    setErrors((current) => ({ ...current, fullName: undefined }));
  }, []);

  const onChangePassword = useCallback((value: string) => {
    setPassword(value);
    setErrors((current) => ({
      ...current,
      confirmPassword: undefined,
      password: undefined,
    }));
  }, []);

  const onLogin = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onRegister = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const nextErrors = validateRegistration(
      {
        confirmPassword,
        email,
        fullName,
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
      const response = await register({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        language,
        password,
      });

      if (response.isError || !response.data) {
        toastService.showError(String(t('common.error')), getRegistrationErrorMessage(response, t));
        return;
      }

      setConfirmPassword('');
      setPassword('');
      navigation.navigate('RegistrationVerification', {
        email: response.data.email,
        resendAvailableInSeconds: response.data.resendAvailableInSeconds,
      });
    } catch (error: unknown) {
      console.error('Unexpected registration failure', error);
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }, [confirmPassword, email, fullName, language, navigation, password, t]);

  return {
    confirmPassword,
    email,
    errors,
    fullName,
    isLoading,
    onChangeConfirmPassword,
    onChangeEmail,
    onChangeName,
    onChangePassword,
    onLogin,
    onRegister,
    password,
  };
};
