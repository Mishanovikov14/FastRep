import { useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '@/UIKit/Button';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';
import type { IProps } from './types';

export const ReportsHeader = ({
  actionTitle,
  isLeadingActionLoading,
  leadingActionTitle,
  onAction,
  onBack,
  onLeadingAction,
  title,
}: IProps) => {
  const { spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);

  return (
    <View style={styles.header}>
      {onBack ? (
        <Button onPress={onBack} size="small" title={String(t('common.back'))} variant="text" />
      ) : leadingActionTitle && onLeadingAction ? (
        <Button
          loading={isLeadingActionLoading}
          onPress={onLeadingAction}
          size="small"
          title={leadingActionTitle}
          variant="text"
        />
      ) : null}
      <Typography numberOfLines={1} style={styles.title} variant="title">
        {title}
      </Typography>
      {actionTitle && onAction ? (
        <Button onPress={onAction} size="small" title={actionTitle} />
      ) : null}
    </View>
  );
};
