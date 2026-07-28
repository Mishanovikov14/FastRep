import { StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (spacing: Spacing) => {
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      alignSelf: 'center',
      gap: scaleVertical(spacing.md),
      justifyContent: 'center',
      maxWidth: 440,
      paddingHorizontal: scaleHorizontal(spacing.xl),
      width: '100%',
    },
    description: {
      marginBottom: scaleVertical(spacing.sm),
    },
    image: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: scaleVertical(spacing.sm),
    },
  });

  return styles;
};
