import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, spacing: Spacing, radius: Radius) => {
  const styles = StyleSheet.create({
    buttonGroup: {
      gap: scaleVertical(spacing.sm),
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: scaleHorizontal(spacing.sm),
      rowGap: scaleVertical(spacing.sm),
    },
    sampleGroup: {
      gap: scaleVertical(spacing.sm),
    },
    section: {
      gap: scaleVertical(spacing.md),
    },
    sections: {
      gap: scaleVertical(spacing.xl),
      paddingBottom: scaleVertical(spacing.xxl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.lg),
    },
    surface: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      gap: scaleVertical(spacing.md),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingVertical: scaleVertical(spacing.lg),
    },
  });

  return styles;
};
