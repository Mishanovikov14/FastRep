import { StyleSheet } from 'react-native';

import type { Colors, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, spacing: Spacing) => {
  return StyleSheet.create({
    actions: {
      gap: scaleVertical(spacing.sm),
    },
    container: {
      backgroundColor: colors.white,
      flex: 1,
      gap: scaleVertical(spacing.xl),
      justifyContent: 'center',
      paddingHorizontal: scaleHorizontal(spacing.xl),
      paddingVertical: scaleVertical(spacing.xl),
    },
    introduction: {
      gap: scaleVertical(spacing.sm),
    },
  });
};
