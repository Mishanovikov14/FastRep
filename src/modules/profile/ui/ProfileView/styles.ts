import { StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (spacing: Spacing) => {
  const styles = StyleSheet.create({
    button: {
      alignSelf: 'center',
      maxWidth: 520,
      width: '100%',
    },
    content: {
      justifyContent: 'center',
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingVertical: scaleVertical(spacing.xl),
    },
  });

  return styles;
};
