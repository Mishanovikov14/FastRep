import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      gap: scaleVertical(spacing.md),
      padding: scaleHorizontal(spacing.lg),
    },
    indicator: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.warning,
      borderRadius: scaleHorizontal(radius.sm),
      borderWidth: 1,
      paddingHorizontal: scaleHorizontal(spacing.md),
      paddingVertical: scaleVertical(spacing.sm),
    },
  });

  return styles;
};
