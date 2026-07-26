import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export type RootStackParamList = {
  Foundation: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

function FoundationPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FastRep</Text>
      <Text style={styles.description}>Project foundation is ready.</Text>
    </View>
  );
}

export function RootNavigation() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen component={FoundationPlaceholder} name="Foundation" />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
});
