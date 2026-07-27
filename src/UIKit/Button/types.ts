import type { ReactNode } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

export type ButtonSize = 'large' | 'medium' | 'small';
export type ButtonVariant = 'danger' | 'primary' | 'secondary' | 'text';

export interface IProps {
  disabled?: boolean;
  fullWidth?: boolean;
  leftElement?: ReactNode;
  loading?: boolean;
  onPress(event: GestureResponderEvent): void;
  rightElement?: ReactNode;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  title: string;
  variant?: ButtonVariant;
}
