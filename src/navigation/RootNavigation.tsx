import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RegistrationView } from '@/modules/auth/ui/RegistrationView';
import { HomeView } from '@/modules/home/ui/HomeView';
import { SplashView } from '@/modules/home/ui/SplashView';

import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigation = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <RootStack.Screen component={SplashView} name="Splash" />
        <RootStack.Screen component={RegistrationView} name="Registration" />
        <RootStack.Screen component={HomeView} name="Home" />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
