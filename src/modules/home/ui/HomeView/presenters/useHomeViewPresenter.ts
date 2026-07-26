import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';

import { keychainStorage } from '@/libs/storage/KeychainStorage';
import { toastService } from '@/libs/toast/toastService';
import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/storage/authStore';

import type { IPresenterInput } from '../types';

export const useHomeViewPresenter = ({ t }: IPresenterInput) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const clearUser = useAuthStore((state) => state.clearUser);
  const user = useAuthStore((state) => state.user);
  const isLoggingOutRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user && !isLoggingOutRef.current) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Registration' }],
      });
    }
  }, [navigation, user]);

  const onLogout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;
    setIsLoading(true);

    try {
      clearUser();
      await keychainStorage.clearTokens();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Registration' }],
      });
    } catch (error: unknown) {
      console.error('Unexpected logout failure', error);
      toastService.showError(
        String(t('common.error')),
        String(t('common.somethingWentWrong')),
      );
    } finally {
      isLoggingOutRef.current = false;
      setIsLoading(false);
    }
  }, [clearUser, navigation, t]);

  return {
    isLoading,
    onLogout,
    user,
  };
};
