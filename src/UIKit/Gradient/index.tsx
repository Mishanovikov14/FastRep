import { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';

import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';
import type { GradientColors } from './types';

export const Gradient = () => {
  const { colors } = useUIContext();
  const styles = useMemo(() => getStyles(), []);
  const gradientColors: GradientColors = [colors.primaryLight, colors.background];

  return <LinearGradient colors={gradientColors} pointerEvents="none" style={styles.gradient} />;
};
