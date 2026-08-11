import { StyleSheet } from 'react-native';

import type { Colors, Fonts, Spacing } from '@/UIProvider/theme/types';
import { scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, fonts: Fonts, spacing: Spacing, bottomInset: number) => {
  const styles = StyleSheet.create({
    tabBar: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      height: scaleVertical(64) + bottomInset,
      paddingBottom: bottomInset,
      paddingTop: scaleVertical(spacing.xs),
    },
    tabLabel: {
      ...fonts.medium,
      fontSize: 12,
    },
  });

  return styles;
};
