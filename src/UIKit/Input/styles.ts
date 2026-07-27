import { StyleSheet } from 'react-native';

import type { Colors, Fonts, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleFontSize, scaleHorizontal, scaleVertical } from '@/utils/scaling';

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
      gap: scaleVertical(spacing.xs),
    },
    input: {
      ...fonts.regular,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: scaleFontSize(16),
      minHeight: scaleVertical(spacing.xxl + spacing.lg),
      paddingHorizontal: scaleHorizontal(spacing.md),
      paddingVertical: scaleVertical(spacing.sm),
    },
  });

  return styles;
};
