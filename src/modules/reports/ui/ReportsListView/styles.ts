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
    container: {
      flex: 1,
    },
    description: {
      maxWidth: 420,
    },
    footer: {
      paddingVertical: scaleVertical(spacing.lg),
    },
    list: {
      flexGrow: 1,
      gap: scaleVertical(spacing.md),
      paddingBottom: scaleVertical(spacing.xl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
    },
  });

  return styles;
};
