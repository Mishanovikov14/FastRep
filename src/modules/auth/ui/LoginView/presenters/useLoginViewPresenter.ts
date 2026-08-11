import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { login } from '@/entities/user/API/userApi';
import { applyAuthenticationResponse } from '@/entities/user/services/userSessionService';
import type { ILoginRequest } from '@/entities/user/types/auth';
import { logger } from '@/libs/logger/logger';
import { toastService } from '@/libs/toast/toastService';
import type { GuestStackParamList } from '@/navigation/types';

import type { IPresenterInput, LoginFormErrors } from '../types';
import { normalizeLoginRequest, validateLogin } from './loginValidation';

interface IRequestFailure {
  status?: number;
  type?: string;
}

type LoginErrorTranslationKey =
  | 'auth.login.invalidCredentials'
  | 'auth.session.networkUnavailable'
  | 'auth.session.serverError'
  | 'auth.session.timeout'
  | 'common.somethingWentWrong';

const getLoginErrorTranslationKey = ({ status, type }: IRequestFailure): LoginErrorTranslationKey => {
  if (status === 401) {
    return 'auth.login.invalidCredentials';
  }

  if (type === 'network_error') {
    return 'auth.session.networkUnavailable';
  }

  if (type === 'timeout_error' || status === 408) {
    return 'auth.session.timeout';
  }

  if (status !== undefined && status >= 500) {
    return 'auth.session.serverError';
  }

  return 'common.somethingWentWrong';
};

export const useLoginViewPresenter = ({ t }: IPresenterInput) => {
  const navigation = useNavigation<NativeStackNavigationProp<GuestStackParamList, 'Login'>>();
  const isSubmittingRef = useRef(false);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const { isPending: isLoginPending, mutateAsync: mutateLogin } = useMutation({
    mutationFn: (request: ILoginRequest) => login(request),
  });

  const onUnexpectedFailure = useCallback(
    () => {
      logger.error('auth.login_failed', { errorCode: 'unexpected_error' });
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    },
    [t],
  );

  const onChangeEmail = useCallback((value: string) => {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined }));
  }, []);

  const onChangePassword = useCallback((value: string) => {
    setPassword(value);
    setErrors((current) => ({ ...current, password: undefined }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const nextErrors = validateLogin({ email, password }, t);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await mutateLogin(normalizeLoginRequest({ email, password }));

      if (response.isError || !response.data) {
        const messageKey = getLoginErrorTranslationKey(response);

        toastService.showError(String(t('common.error')), String(t(messageKey)));
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
      onUnexpectedFailure();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [email, mutateLogin, onUnexpectedFailure, password, t]);

  const onPressRegistration = useCallback(() => {
    navigation.navigate('Registration');
  }, [navigation]);

  const onPressForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  return {
    email,
    emailError: errors.email,
    isLoading: isSubmitting || isLoginPending,
    onChangeEmail,
    onChangePassword,
    onPressForgotPassword,
    onPressRegistration,
    onSubmit,
    password,
    passwordError: errors.password,
  };
};
