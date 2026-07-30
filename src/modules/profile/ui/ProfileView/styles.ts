import { StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (spacing: Spacing) => {
  const styles = StyleSheet.create({
    button: {
      alignSelf: 'center',
      marginTop: 'auto',
      maxWidth: 520,
      width: '100%',
    },
    content: {
      gap: scaleVertical(spacing.xl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingVertical: scaleVertical(spacing.xl),
    },
  });

  return styles;
};
