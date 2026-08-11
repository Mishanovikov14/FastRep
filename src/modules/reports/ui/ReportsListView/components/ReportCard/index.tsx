import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import type { IReport } from '@/entities/report/types/report';
import { ReportStatusBadge } from '@/modules/reports/ui/components/ReportStatusBadge';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useReportCardPresenter } from './presenters/useReportCardPresenter';
import { getStyles } from './styles';

interface IProps {
  onPress(report: IReport): void;
  report: IReport;
}

export const ReportCard = ({ onPress, report }: IProps) => {
  const { colors, language, radius, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);
  const { dateLabel, displayTitle, getCardStyle, onPressCard } = useReportCardPresenter({
    cardPressedStyle: styles.cardPressed,
    cardStyle: styles.card,
    language,
    onPress,
    report,
    t,
  });

  return (
    <Pressable accessibilityRole="button" onPress={onPressCard} style={getCardStyle}>
      <Typography numberOfLines={2} variant="heading">
        {displayTitle}
      </Typography>
      {report.notes ? (
        <Typography color={colors.textSecondary} numberOfLines={2}>
          {report.notes}
        </Typography>
      ) : null}
      <View style={styles.footer}>
        <ReportStatusBadge status={report.status} />
        <Typography color={colors.textSecondary} variant="caption">
          {dateLabel}
        </Typography>
      </View>
    </Pressable>
  );
};
