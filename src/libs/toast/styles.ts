import { StyleSheet } from 'react-native';

import type { Colors, Fonts, Spacing } from '@/UIProvider/theme/types';
import { scaleFontSize, scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, fonts: Fonts, spacing: Spacing, accentColor: string) => {
  const styles = StyleSheet.create({
    content: {
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingVertical: scaleVertical(spacing.md),
    },
    contentCompact: {
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingVertical: scaleVertical(spacing.sm),
    },
    root: {
      borderLeftColor: accentColor,
      height: 'auto',
      minHeight: scaleVertical(60),
    },
    rootCompact: {
      borderLeftColor: accentColor,
      height: 'auto',
      minHeight: scaleVertical(48),
    },
    text1: {
      ...fonts.semibold,
      color: colors.textPrimary,
      fontSize: scaleFontSize(15),
    },
    text2: {
      ...fonts.regular,
      color: colors.textSecondary,
      fontSize: scaleFontSize(14),
    },
  });

  return styles;
};
