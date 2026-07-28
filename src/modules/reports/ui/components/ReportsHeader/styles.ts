import { StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (spacing: Spacing) => {
  const styles = StyleSheet.create({
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
      paddingBottom: scaleVertical(spacing.md),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.md),
    },
    title: {
      flex: 1,
    },
  });

  return styles;
};
