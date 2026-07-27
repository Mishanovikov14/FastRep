import { StyleSheet } from 'react-native';

import type { Colors, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, spacing: Spacing) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      gap: scaleVertical(spacing.lg),
      paddingHorizontal: scaleHorizontal(spacing.xl),
      paddingTop: scaleVertical(46),
    },
    fields: {
      gap: scaleVertical(spacing.lg),
    },
    header: {
      gap: scaleVertical(spacing.sm),
    },
    login: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    logo: {
      alignSelf: 'center',
      height: scaleVertical(80),
      maxWidth: Math.min(scaleHorizontal(320), 320),
      width: '82%',
    },
    buttonsContainer: {
      gap: scaleVertical(spacing.sm),
    },
  });

  return styles;
};
