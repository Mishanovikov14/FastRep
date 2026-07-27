import { StyleSheet } from 'react-native';

import { scaleVertical } from '@/utils/scaling';

export const getStyles = () => {
  const styles = StyleSheet.create({
    gradient: {
      height: scaleVertical(319),
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
  });

  return styles;
};
