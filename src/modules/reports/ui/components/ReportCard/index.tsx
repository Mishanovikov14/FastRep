import { useCallback, useMemo } from 'react';
import type { GestureResponderEvent, PressableStateCallbackType } from 'react-native';
import { Pressable, View } from 'react-native';

import { ReportStatusBadge } from '@/modules/reports/ui/components/ReportStatusBadge';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';
import { formatLocalizedDate } from '@/utils/formatLocalizedDate';

import { getStyles } from './styles';
import type { IProps } from './types';

export const ReportCard = ({ onPress, report }: IProps) => {
  const { colors, language, radius, spacing, t } = useUIContext();
  const styles = useMemo(
    () => getStyles(colors, radius, spacing),
    [colors, radius, spacing],
  );
  const isUpdated = report.updatedAt !== report.createdAt;

  const onPressCard = useCallback(
    (_event: GestureResponderEvent) => {
      onPress(report);
    },
    [onPress, report],
  );

  const getCardStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.card,
      pressed && styles.cardPressed,
    ],
    [styles],
  );

  return (
    <Pressable accessibilityRole="button" onPress={onPressCard} style={getCardStyle}>
      <Typography numberOfLines={2} variant="heading">
        {report.title}
      </Typography>
      {report.notes ? (
        <Typography color={colors.textSecondary} numberOfLines={2}>
          {report.notes}
        </Typography>
      ) : null}
      <View style={styles.footer}>
        <ReportStatusBadge status={report.status} />
        <Typography color={colors.textSecondary} variant="caption">
          {t(isUpdated ? 'reports.card.updated' : 'reports.card.created', {
            date: formatLocalizedDate(
              isUpdated ? report.updatedAt : report.createdAt,
              language,
            ),
          })}
        </Typography>
      </View>
    </Pressable>
  );
};
