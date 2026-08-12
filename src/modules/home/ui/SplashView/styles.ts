import { StyleSheet } from 'react-native';

import type { Colors, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, spacing: Spacing) => {
  const styles = StyleSheet.create({
    content: {
      alignItems: 'center',
      backgroundColor: colors.background,
      gap: scaleVertical(spacing.xl),
      justifyContent: 'center',
      paddingHorizontal: scaleHorizontal(spacing.xl),
    },
    logo: {
      height: scaleVertical(88),
      maxWidth: Math.min(scaleHorizontal(340), 340),
      width: '90%',
    },
    status: {
      alignItems: 'center',
      gap: scaleVertical(spacing.lg),
      maxWidth: Math.min(scaleHorizontal(360), 360),
    },
  });

  return styles;
};
