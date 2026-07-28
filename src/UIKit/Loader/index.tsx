import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';

interface IProps {
  color?: string;
  fullscreen?: boolean;
  size?: 'large' | 'small';
  transparent?: boolean;
}

export const Loader = ({ color, fullscreen = false, size = 'small', transparent = false }: IProps) => {
  const { colors, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const indicator = (
    <ActivityIndicator
      accessibilityLabel={String(t('common.loading'))}
      accessibilityRole="progressbar"
      color={color ?? colors.primary}
      size={size}
    />
  );

  if (!fullscreen) {
    return indicator;
  }

  return <View style={[styles.fullscreen, transparent && styles.transparent]}>{indicator}</View>;
};
