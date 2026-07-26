import { StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';

export const getStyles = (spacing: Spacing) => {
  const styles = StyleSheet.create({
    content: {
      alignItems: 'center',
      gap: spacing.md,
      justifyContent: 'center',
    },
  });

  return styles;
};
