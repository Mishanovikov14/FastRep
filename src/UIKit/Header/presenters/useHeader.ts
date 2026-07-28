import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useCallback } from 'react';
import type { PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native';

interface IInput {
  backButtonPressedStyle: StyleProp<ViewStyle>;
  backButtonStyle: StyleProp<ViewStyle>;
  onBackPress?(): void;
}

export const useHeader = ({ backButtonPressedStyle, backButtonStyle, onBackPress }: IInput) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const onPressBack = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    navigation.goBack();
  }, [navigation, onBackPress]);

  const getBackButtonStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
      backButtonStyle,
      pressed && backButtonPressedStyle,
    ],
    [backButtonPressedStyle, backButtonStyle],
  );

  return {
    getBackButtonStyle,
    onPressBack,
  };
};
