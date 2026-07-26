import type { ReactElement, ReactNode, RefObject } from 'react';
import type { RefreshControlProps, StyleProp, ViewStyle } from 'react-native';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import type { Edge } from 'react-native-safe-area-context';

export interface IProps {
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  footerComponent?: ReactNode;
  headerComponent?: ReactNode;
  isKeyboardAvoiding?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollEnabled?: boolean;
  scrollRef?: RefObject<KeyboardAwareScrollViewRef | null>;
  withGradient?: boolean;
}
