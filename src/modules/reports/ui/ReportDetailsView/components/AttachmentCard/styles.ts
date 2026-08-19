import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  return StyleSheet.create({
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.xs),
    },
    audioProgressFill: {
      backgroundColor: colors.primary,
      borderRadius: 2,
      height: 4,
    },
    audioProgressTrack: {
      backgroundColor: colors.background,
      borderRadius: 2,
      height: 4,
      overflow: 'hidden',
    },
    card: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
      minHeight: scaleVertical(68),
      padding: scaleHorizontal(spacing.sm),
    },
    content: {
      flex: 1,
      gap: scaleVertical(spacing.xs),
    },
    iconButton: {
      alignItems: 'center',
      borderRadius: scaleHorizontal(radius.sm),
      justifyContent: 'center',
      minHeight: scaleHorizontal(38),
      minWidth: scaleHorizontal(38),
    },
    pressedCard: {
      backgroundColor: colors.primaryLight,
    },
    rejectedCard: {
      backgroundColor: `${colors.error}0D`,
      borderColor: colors.error,
    },
    rejectedIcon: {
      backgroundColor: `${colors.error}14`,
    },
    thumbnail: {
      borderRadius: scaleHorizontal(radius.sm),
      height: scaleHorizontal(52),
      width: scaleHorizontal(52),
    },
    typeIcon: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: scaleHorizontal(radius.md),
      height: scaleHorizontal(52),
      justifyContent: 'center',
      width: scaleHorizontal(52),
    },
  });
};
