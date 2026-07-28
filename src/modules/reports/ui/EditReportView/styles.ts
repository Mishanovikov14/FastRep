import { StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (spacing: Spacing) => {
  const styles = StyleSheet.create({
    centered: {
      alignItems: 'center',
      flex: 1,
      gap: scaleVertical(spacing.md),
      justifyContent: 'center',
      paddingHorizontal: scaleHorizontal(spacing.xl),
    },
    content: {
      paddingBottom: scaleVertical(spacing.xl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.md),
    },
  });

  return styles;
};
