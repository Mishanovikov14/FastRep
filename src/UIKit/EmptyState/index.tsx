import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '@/UIKit/Button';
import type { ButtonVariant } from '@/UIKit/Button/types';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';

interface IEmptyStateAction {
  onPress(): void;
  title: string;
  variant?: ButtonVariant;
}

interface IProps {
  action?: IEmptyStateAction;
  description: string;
  image: ReactNode;
  title: string;
}

export const EmptyState = ({ action, description, image, title }: IProps) => {
  const { colors, spacing } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);

  return (
    <View style={styles.container}>
      <View style={styles.image}>{image}</View>
      <Typography align="center" variant="heading">
        {title}
      </Typography>
      <Typography
        align="center"
        color={colors.textSecondary}
        style={styles.description}
      >
        {description}
      </Typography>
      {action ? (
        <Button
          onPress={action.onPress}
          title={action.title}
          variant={action.variant}
        />
      ) : null}
    </View>
  );
};
