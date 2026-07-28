import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: scaleHorizontal(radius.full),
      borderWidth: 1,
      paddingHorizontal: scaleHorizontal(spacing.md),
      paddingVertical: scaleVertical(spacing.xs),
    },
    draft: {
      borderColor: colors.textSecondary,
    },
    failed: {
      borderColor: colors.error,
    },
    processing: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.info,
    },
    ready: {
      borderColor: colors.success,
    },
  });

  return styles;
};
