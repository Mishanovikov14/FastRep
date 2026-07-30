import { useMemo } from 'react';
import { View } from 'react-native';

import type { IAppEnvironment } from '@/entities/environment/types/appEnvironment';
import { Button } from '@/UIKit/Button';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';

interface IProps {
  activeEnvironment: IAppEnvironment;
  disabled: boolean;
  indicatorText: string;
  onPress(): void;
  sectionTitle: string;
}

export const EnvironmentSection = ({
  activeEnvironment,
  disabled,
  indicatorText,
  onPress,
  sectionTitle,
}: IProps) => {
  const { colors, radius, spacing } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);

  return (
    <View style={styles.container}>
      <Typography variant="heading">{sectionTitle}</Typography>
      <Button
        disabled={disabled}
        fullWidth
        onPress={onPress}
        title={activeEnvironment.displayName}
        variant="secondary"
      />
      {!activeEnvironment.isProduction ? (
        <View style={styles.indicator}>
          <Typography color={colors.warning} variant="caption" weight="semibold">
            {indicatorText}
          </Typography>
        </View>
      ) : null}
    </View>
  );
};
