import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    card: {
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.xl,
      maxWidth: 520,
      padding: spacing.xl,
      width: '100%',
    },
    content: {
      justifyContent: 'center',
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    details: {
      gap: spacing.lg,
    },
    detail: {
      gap: spacing.xs,
    },
  });

  return styles;
};
