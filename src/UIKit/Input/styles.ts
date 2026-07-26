import { StyleSheet } from 'react-native';

import type { Colors, Fonts, Radius, Spacing } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors, fonts: Fonts, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    disabled: {
      backgroundColor: colors.background,
      color: colors.textDisabled,
    },
    error: {
      borderColor: colors.error,
    },
    field: {
      gap: spacing.xs,
    },
    input: {
      ...fonts.regular,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: 16,
      minHeight: spacing.xxl + spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
  });

  return styles;
};
