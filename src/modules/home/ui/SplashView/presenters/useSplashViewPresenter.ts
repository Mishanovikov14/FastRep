import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import type { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/storage/authStore';

import type { SplashDestination } from '../types';

export const useSplashViewPresenter = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Splash'>>();
  const isAuthorized = useAuthStore((state) => state.isAuthorized);

  useEffect(() => {
    const destination: SplashDestination = isAuthorized ? 'Home' : 'Registration';

    navigation.reset({
      index: 0,
      routes: [{ name: destination }],
    });
  }, [isAuthorized, navigation]);
};
