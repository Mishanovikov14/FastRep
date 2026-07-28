import { StyleSheet } from 'react-native';

import type { Colors } from '@/UIProvider/theme/types';

export const getStyles = (colors: Colors, backgroundColor: string = colors.background) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
    },
    mainContainer: {
      backgroundColor,
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
  });

  return styles;
};
