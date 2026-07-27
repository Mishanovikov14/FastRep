import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useUserStore } from '@/entities/user/model/userStore';
import { ForgotPasswordView } from '@/modules/auth/ui/ForgotPasswordView';
import { LoginView } from '@/modules/auth/ui/LoginView';
import { OtpVerificationView } from '@/modules/auth/ui/OtpVerificationView';
import { RegistrationView } from '@/modules/auth/ui/RegistrationView';
import { ResetPasswordView } from '@/modules/auth/ui/ResetPasswordView';
import { HomeView } from '@/modules/home/ui/HomeView';
import { SplashView } from '@/modules/home/ui/SplashView';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getRootNavigationState } from './getRootNavigationState';
import type { AppStackParamList, GuestStackParamList, SplashStackParamList } from './types';

const AppStack = createNativeStackNavigator<AppStackParamList>();
const GuestStack = createNativeStackNavigator<GuestStackParamList>();
const SplashStack = createNativeStackNavigator<SplashStackParamList>();

const AppNavigation = () => {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen component={HomeView} name="Home" />
    </AppStack.Navigator>
  );
};

const GuestNavigation = () => {
  return (
    <GuestStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <GuestStack.Screen component={LoginView} name="Login" />
      <GuestStack.Screen component={RegistrationView} name="Registration" />
      <GuestStack.Screen component={ForgotPasswordView} name="ForgotPassword" />
      <GuestStack.Screen component={OtpVerificationView} name="OtpVerification" />
      <GuestStack.Screen component={ResetPasswordView} name="ResetPassword" />
    </GuestStack.Navigator>
  );
};

const SplashNavigation = () => {
  return (
    <SplashStack.Navigator screenOptions={{ headerShown: false }}>
      <SplashStack.Screen component={SplashView} name="Splash" />
    </SplashStack.Navigator>
  );
};

export const RootNavigation = () => {
  const { isInitialized } = useUIContext();
  const isAuthorized = useUserStore((state) => state.isAuthorized);
  const isSessionRestored = useUserStore((state) => state.isSessionRestored);
  const navigationState = getRootNavigationState({
    isAuthorized,
    isSessionRestored: isInitialized && isSessionRestored,
  });

  const renderNavigation = () => {
    switch (navigationState) {
      case 'app':
        return <AppNavigation />;
      case 'guest':
        return <GuestNavigation />;
      case 'splash':
        return <SplashNavigation />;
    }
  };

  return (
    <NavigationContainer>{renderNavigation()}</NavigationContainer>
  );
};
