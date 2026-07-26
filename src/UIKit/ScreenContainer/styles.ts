import { StyleSheet } from 'react-native';

import type { Colors, Spacing } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors, spacing: Spacing) => {
  const styles = StyleSheet.create({
    content: {
      flexGrow: 1,
    },
    flex: {
      flex: 1,
    },
    horizontalPadding: {
      paddingHorizontal: spacing.lg,
    },
    root: {
      backgroundColor: colors.background,
      flex: 1,
    },
  });

  return styles;
};
