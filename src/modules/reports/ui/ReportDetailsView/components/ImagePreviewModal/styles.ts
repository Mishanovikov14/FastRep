import { Dimensions, StyleSheet } from 'react-native';

import type { Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

const { height, width } = Dimensions.get('window');

export const getStyles = (spacing: Spacing) => {
  return StyleSheet.create({
    closeButton: {
      alignItems: 'center',
      backgroundColor: '#00000099',
      borderRadius: scaleHorizontal(24),
      height: scaleHorizontal(44),
      justifyContent: 'center',
      position: 'absolute',
      right: scaleHorizontal(spacing.lg),
      top: scaleVertical(spacing.xxl),
      width: scaleHorizontal(44),
    },
    container: {
      backgroundColor: '#000000',
      flex: 1,
    },
    image: {
      height,
      width,
    },
    imagePage: {
      alignItems: 'center',
      height,
      justifyContent: 'center',
      width,
    },
  });
};
