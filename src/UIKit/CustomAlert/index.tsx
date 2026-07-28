import { useMemo } from 'react';
import { Modal, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';
import type { ICustomAlertAction } from './types';

interface IProps {
  actions: ICustomAlertAction[];
  description: string;
  onDismiss(): void;
  title: string;
  visible: boolean;
}

export const CustomAlert = ({ actions, description, onDismiss, title, visible }: IProps) => {
  const { colors, radius, spacing } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);

  return (
    <Modal animationType="fade" onRequestClose={onDismiss} transparent visible={visible}>
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.card}>
          <Typography variant="heading">{title}</Typography>
          <Typography color={colors.textSecondary}>{description}</Typography>
          <View style={styles.actions}>
            {actions.map((action) => (
              <Button
                disabled={action.disabled}
                key={action.key}
                loading={action.loading}
                onPress={action.onPress}
                style={styles.action}
                title={action.title}
                variant={action.variant}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};
