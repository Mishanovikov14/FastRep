import { StyleSheet } from 'react-native';

import type { Colors, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, spacing: Spacing) => {
  const styles = StyleSheet.create({
    card: {
      alignSelf: 'center',
      gap: scaleVertical(spacing.xl),
      maxWidth: Math.min(scaleHorizontal(440), 440),
      width: '100%',
    },
    content: {
      backgroundColor: colors.white,
      justifyContent: 'center',
      paddingHorizontal: scaleHorizontal(spacing.xl),
      paddingVertical: scaleVertical(spacing.xxl),
    },
    fields: {
      gap: scaleVertical(spacing.lg),
    },
    header: {
      gap: scaleVertical(spacing.sm),
    },
    logo: {
      alignSelf: 'center',
      aspectRatio: 1160 / 330,
      maxWidth: Math.min(scaleHorizontal(320), 320),
      width: '82%',
    },
  });

  return styles;
};
