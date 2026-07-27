import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    card: {
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.lg),
      borderWidth: 1,
      gap: scaleVertical(spacing.xl),
      maxWidth: Math.min(scaleHorizontal(520), 520),
      paddingHorizontal: scaleHorizontal(spacing.xl),
      paddingVertical: scaleVertical(spacing.xl),
      width: '100%',
    },
    content: {
      justifyContent: 'center',
      paddingBottom: scaleVertical(spacing.xl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.xl),
    },
    details: {
      gap: scaleVertical(spacing.lg),
    },
    detail: {
      gap: scaleVertical(spacing.xs),
    },
  });

  return styles;
};
