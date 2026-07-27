import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors, spacing: Spacing, radius: Radius) => {
  const styles = StyleSheet.create({
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    dangerPressed: {
      backgroundColor: colors.primaryPressed,
    },
    disabled: {
      opacity: 0.5,
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    large: {
      minHeight: spacing.xxl + spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    medium: {
      minHeight: spacing.xxl + spacing.md,
      paddingHorizontal: spacing.lg,
    },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    primaryPressed: {
      backgroundColor: colors.primaryPressed,
      borderColor: colors.primaryPressed,
    },
    root: {
      alignItems: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      justifyContent: 'center',
    },
    small: {
      minHeight: spacing.xxl,
      paddingHorizontal: spacing.md,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    secondaryPressed: {
      backgroundColor: colors.primaryLight,
    },
    text: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    textPressed: {
      backgroundColor: colors.primaryLight,
    },
  });

  return styles;
};
