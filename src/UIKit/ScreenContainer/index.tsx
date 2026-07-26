import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUIContext } from '@/UIProvider';

import { styles } from './styles';
import type { IProps } from './types';

export function ScreenContainer({
  avoidKeyboard = false,
  children,
  contentContainerStyle,
  edges = ['top', 'right', 'bottom', 'left'],
  horizontalPadding = false,
  scroll = false,
  style,
}: IProps) {
  const { colors, spacing } = useUIContext();
  const contentStyle = [
    styles.content,
    horizontalPadding && { paddingHorizontal: spacing.lg },
    contentContainerStyle,
  ];
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      style={styles.flex}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: colors.background }, style]}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
