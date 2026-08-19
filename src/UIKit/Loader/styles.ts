import { StyleSheet } from 'react-native';

import type { Colors } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors) => {
  const styles = StyleSheet.create({
    fullscreen: {
      alignItems: 'center',
      backgroundColor: colors.background,
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 1,
    },
    transparent: {
      backgroundColor: 'transparent',
    },
  });

  return styles;
};
