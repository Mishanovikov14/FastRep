import { StyleSheet } from 'react-native';

import type { Colors, Fonts, Spacing } from '@/UIProvider';

export function getStyles(colors: Colors, fonts: Fonts, spacing: Spacing, accentColor: string) {
  const styles = StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
    },
    root: {
      borderLeftColor: accentColor,
    },
    text1: {
      ...fonts.semibold,
      color: colors.textPrimary,
      fontSize: 15,
    },
    text2: {
      ...fonts.regular,
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

  return styles;
}
