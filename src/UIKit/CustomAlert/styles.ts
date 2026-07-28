import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    action: {
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
    },
    backdrop: {
      backgroundColor: colors.black,
      bottom: 0,
      left: 0,
      opacity: 0.45,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: scaleHorizontal(radius.lg),
      gap: scaleVertical(spacing.lg),
      marginHorizontal: scaleHorizontal(spacing.lg),
      maxWidth: 520,
      padding: scaleHorizontal(spacing.xl),
      width: '90%',
    },
    container: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
  });

  return styles;
};
