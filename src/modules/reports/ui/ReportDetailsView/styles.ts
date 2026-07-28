import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.lg),
      borderWidth: 1,
      gap: scaleVertical(spacing.lg),
      padding: scaleHorizontal(spacing.lg),
    },
    centered: {
      alignItems: 'center',
      flex: 1,
      gap: scaleVertical(spacing.md),
      justifyContent: 'center',
      paddingHorizontal: scaleHorizontal(spacing.xl),
    },
    content: {
      gap: scaleVertical(spacing.lg),
      paddingBottom: scaleVertical(spacing.xl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.md),
    },
    dateRow: {
      gap: scaleVertical(spacing.xs),
    },
    notes: {
      lineHeight: scaleVertical(24),
    },
  });

  return styles;
};
