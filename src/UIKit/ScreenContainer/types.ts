import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

export interface IProps {
  avoidKeyboard?: boolean;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  horizontalPadding?: boolean;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}
