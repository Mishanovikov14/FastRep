import { StyleSheet } from 'react-native';

import type { Colors } from '@/UIProvider';

export function getStyles(colors: Colors) {
  const styles = StyleSheet.create({
    fullscreen: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
    },
  });

  return styles;
}
