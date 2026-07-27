import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors, spacing: Spacing, radius: Radius) => {
  const styles = StyleSheet.create({
    buttonGroup: {
      gap: spacing.sm,
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    sampleGroup: {
      gap: spacing.sm,
    },
    section: {
      gap: spacing.md,
    },
    sections: {
      gap: spacing.xl,
      paddingBottom: spacing.xxl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    surface: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
    },
  });

  return styles;
};
