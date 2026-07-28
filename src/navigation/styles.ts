import { StyleSheet } from 'react-native';

import type { Colors, Fonts, Spacing } from '@/UIProvider/theme/types';
import { scaleVertical } from '@/utils/scaling';

export const getStyles = (
  colors: Colors,
  fonts: Fonts,
  spacing: Spacing,
) => {
  const styles = StyleSheet.create({
    tabBar: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      paddingTop: scaleVertical(spacing.xs),
    },
    tabLabel: {
      ...fonts.medium,
      fontSize: 12,
    },
  });

  return styles;
};
