import { StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';
import { scaleVertical } from '@/utils/scaling';

export const getStyles = (spacing: Spacing) => {
  const styles = StyleSheet.create({
    form: {
      gap: scaleVertical(spacing.lg),
    },
    notes: {
      minHeight: scaleVertical(180),
      textAlignVertical: 'top',
    },
  });

  return styles;
};
