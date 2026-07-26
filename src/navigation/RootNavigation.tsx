import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FoundationShowcaseScreen } from './FoundationShowcaseScreen';

export type RootStackParamList = {
  Foundation: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigation() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen component={FoundationShowcaseScreen} name="Foundation" />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
