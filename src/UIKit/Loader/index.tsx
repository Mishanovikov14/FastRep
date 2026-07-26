import { ActivityIndicator, View } from 'react-native';

import { useUIContext } from '@/UIProvider/useUIContext';

import { styles } from './styles';
import type { IProps } from './types';

export function Loader({ color, fullscreen = false, size = 'small' }: IProps) {
  const { colors, t } = useUIContext();
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

  return (
    <View style={[styles.fullscreen, { backgroundColor: colors.background }]}>{indicator}</View>
  );
}
