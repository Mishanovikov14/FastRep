import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.lg),
      borderWidth: 1,
      gap: scaleVertical(spacing.md),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingVertical: scaleVertical(spacing.lg),
    },
    cardPressed: {
      borderColor: colors.primary,
    },
    footer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
      justifyContent: 'space-between',
    },
  });

  return styles;
};
