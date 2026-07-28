import { useMemo } from 'react';
import { Modal, View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';
import type { IProps } from './types';

export const DeleteReportModal = ({
  isDeleting,
  onCancel,
  onConfirm,
  visible,
}: IProps) => {
  const { colors, radius, spacing, t } = useUIContext();
  const styles = useMemo(
    () => getStyles(colors, radius, spacing),
    [colors, radius, spacing],
  );

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.card}>
          <Typography variant="heading">{t('reports.delete.title')}</Typography>
          <Typography color={colors.textSecondary}>
            {t('reports.delete.confirmation')}
          </Typography>
          <View style={styles.actions}>
            <Button
              disabled={isDeleting}
              onPress={onCancel}
              title={String(t('common.cancel'))}
              variant="secondary"
            />
            <Button
              loading={isDeleting}
              onPress={onConfirm}
              title={String(t('reports.delete.action'))}
              variant="danger"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
