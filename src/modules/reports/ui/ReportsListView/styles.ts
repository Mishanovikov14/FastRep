import { StyleSheet } from 'react-native';

import type { Colors, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (
  colors: Colors,
  spacing: Spacing,
  bottomInset: number,
) => {
  const styles = StyleSheet.create({
    action: {
      alignSelf: 'center',
      maxWidth: 520,
      width: '100%',
    },
    bottomAction: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingBottom: Math.max(bottomInset, scaleVertical(spacing.md)),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.md),
    },
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
    empty: {
      flex: 1,
      justifyContent: 'center',
    },
    footer: {
      paddingVertical: scaleVertical(spacing.lg),
    },
    list: {
      flexGrow: 1,
      gap: scaleVertical(spacing.md),
      paddingBottom: scaleVertical(spacing.xl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.md),
    },
  });

  return styles;
};
