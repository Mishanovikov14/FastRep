import { useMemo } from 'react';
import { View } from 'react-native';

import type { ReportStatus } from '@/entities/report/types/report';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';

interface IProps {
  status: ReportStatus;
}

const statusTranslationKeys: Record<ReportStatus, string> = {
  DRAFT: 'reports.status.draft',
  FAILED: 'reports.status.failed',
  PROCESSING: 'reports.status.processing',
  QUEUED: 'reports.status.queued',
  READY: 'reports.status.ready',
};

export const ReportStatusBadge = ({ status }: IProps) => {
  const { colors, radius, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);
  const styleByStatus = {
    DRAFT: styles.draft,
    FAILED: styles.failed,
    PROCESSING: styles.processing,
    QUEUED: styles.processing,
    READY: styles.ready,
  };
  const colorByStatus = {
    DRAFT: colors.textSecondary,
    FAILED: colors.error,
    PROCESSING: colors.info,
    QUEUED: colors.info,
    READY: colors.success,
  };

  return (
    <View style={[styles.badge, styleByStatus[status]]}>
      <Typography color={colorByStatus[status]} variant="caption" weight="semibold">
        {t(statusTranslationKeys[status])}
      </Typography>
    </View>
  );
};
