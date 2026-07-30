import { StyleSheet } from 'react-native';

import type { Colors, Fonts, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, fonts: Fonts, radius: Radius, spacing: Spacing) => {
  return StyleSheet.create({
    activeSlot: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    container: {
      gap: scaleVertical(spacing.sm),
    },
    disabledSlot: {
      backgroundColor: colors.background,
      opacity: 0.65,
    },
    errorSlot: {
      borderColor: colors.error,
    },
    hiddenInput: {
      ...fonts.regular,
      bottom: 0,
      color: 'transparent',
      left: 0,
      opacity: 0.02,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    slot: {
      alignItems: 'center',
      aspectRatio: 0.82,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      maxWidth: scaleHorizontal(52),
    },
    slots: {
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
      justifyContent: 'center',
    },
  });
};
