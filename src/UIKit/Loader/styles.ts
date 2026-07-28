import { StyleSheet } from 'react-native';

import type { Colors } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors) => {
  const styles = StyleSheet.create({
    fullscreen: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      backgroundColor: colors.background,
      justifyContent: 'center',
      zIndex: 1,
    },
    transparent: {
      backgroundColor: 'transparent',
    },
  });

  return styles;
};
