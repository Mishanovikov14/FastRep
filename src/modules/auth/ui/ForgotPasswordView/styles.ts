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
      gap: scaleVertical(spacing.lg),
      paddingHorizontal: scaleHorizontal(spacing.xl),
      paddingTop: scaleVertical(46),
    },
    header: {
      gap: scaleVertical(spacing.sm),
      paddingTop: scaleVertical(24),
    },
    logo: {
      alignSelf: 'center',
      height: scaleVertical(80),
      maxWidth: Math.min(scaleHorizontal(320), 320),
      width: '82%',
    },
  });
};
