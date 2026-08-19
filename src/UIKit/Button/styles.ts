import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, spacing: Spacing, radius: Radius) => {
  const styles = StyleSheet.create({
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
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
    buttonText: {
      textAlign: 'center'
    },
    large: {
      minHeight: scaleVertical(spacing.xxl + spacing.lg),
      paddingHorizontal: scaleHorizontal(spacing.xl),
    },
    loaderOverlay: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    loadingContent: {
      opacity: 0,
    },
    medium: {
      minHeight: scaleVertical(spacing.xxl + spacing.md),
      paddingHorizontal: scaleHorizontal(spacing.lg),
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
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      justifyContent: 'center',
    },
    small: {
      minHeight: scaleVertical(spacing.xxl),
      paddingHorizontal: scaleHorizontal(spacing.md),
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
