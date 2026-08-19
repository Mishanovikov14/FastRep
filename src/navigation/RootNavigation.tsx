import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { ProfileIcon } from '@/assets/icons/ProfileIcon';
import { ReportsIcon } from '@/assets/icons/ReportsIcon';
import { useUserStore } from '@/entities/user/model/userStore';
import { useAppSafeAreaInsets } from '@/hooks/useAppSafeAreaInsets';
import { ForgotPasswordView } from '@/modules/auth/ui/ForgotPasswordView';
import { LoginView } from '@/modules/auth/ui/LoginView';
import { OtpVerificationView } from '@/modules/auth/ui/OtpVerificationView';
import { RegistrationView } from '@/modules/auth/ui/RegistrationView';
import { RegistrationVerificationView } from '@/modules/auth/ui/RegistrationVerificationView';
import { ResetPasswordView } from '@/modules/auth/ui/ResetPasswordView';
import { SplashView } from '@/modules/home/ui/SplashView';
import { ProfileView } from '@/modules/profile/ui/ProfileView';
import { CreateReportView } from '@/modules/reports/ui/CreateReportView';
import { EditReportView } from '@/modules/reports/ui/EditReportView';
import { ReportDetailsView } from '@/modules/reports/ui/ReportDetailsView';
import { ReportsListView } from '@/modules/reports/ui/ReportsListView';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getRootNavigationState } from './getRootNavigationState';
import { getStyles } from './styles';
import type { AppStackParamList, AppTabsParamList, GuestStackParamList, SplashStackParamList } from './types';

const AppStack = createNativeStackNavigator<AppStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabsParamList>();
const GuestStack = createNativeStackNavigator<GuestStackParamList>();
const SplashStack = createNativeStackNavigator<SplashStackParamList>();

interface ITabBarIconProps {
  color: string;
  size: number;
}

const ReportsTabIcon = ({ color, size }: ITabBarIconProps) => {
  return <ReportsIcon color={color} height={size} width={size} />;
};

const ProfileTabIcon = ({ color, size }: ITabBarIconProps) => {
  return <ProfileIcon color={color} height={size} width={size} />;
};

const AppTabsNavigation = () => {
  const { colors, fonts, spacing, t } = useUIContext();
  const { bottom } = useAppSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors, fonts, spacing, bottom), [bottom, colors, fonts, spacing]);

  return (
    <AppTabs.Navigator
      initialRouteName="Reports"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <AppTabs.Screen
        component={ReportsListView}
        name="Reports"
        options={{
          tabBarIcon: ReportsTabIcon,
          tabBarLabel: String(t('reports.list.title')),
        }}
      />
      <AppTabs.Screen
        component={ProfileView}
        name="Profile"
        options={{
          tabBarIcon: ProfileTabIcon,
          tabBarLabel: String(t('profile.title')),
        }}
      />
    </AppTabs.Navigator>
  );
};

const AppNavigation = () => {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen component={AppTabsNavigation} name="Tabs" />
      <AppStack.Screen component={CreateReportView} name="CreateReport" />
      <AppStack.Screen component={ReportDetailsView} name="ReportDetails" />
      <AppStack.Screen component={EditReportView} name="EditReport" />
    </AppStack.Navigator>
  );
};

const GuestNavigation = () => {
  return (
    <GuestStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <GuestStack.Screen component={LoginView} name="Login" />
      <GuestStack.Screen component={RegistrationView} name="Registration" />
      <GuestStack.Screen component={RegistrationVerificationView} name="RegistrationVerification" />
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

  return <NavigationContainer>{renderNavigation()}</NavigationContainer>;
};
