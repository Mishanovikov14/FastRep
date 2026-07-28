import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { DeleteReportModal } from '@/modules/reports/ui/components/DeleteReportModal';
import { ReportStatusBadge } from '@/modules/reports/ui/components/ReportStatusBadge';
import { ReportsHeader } from '@/modules/reports/ui/components/ReportsHeader';
import type { AppStackParamList } from '@/navigation/types';
import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';
import { formatLocalizedDate } from '@/utils/formatLocalizedDate';

import { useReportDetailsViewPresenter } from './presenters/useReportDetailsViewPresenter';
import { getStyles } from './styles';

export const ReportDetailsView = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'ReportDetails'>>();
  const { colors, language, radius, spacing, t } = useUIContext();
  const styles = useMemo(
    () => getStyles(colors, radius, spacing),
    [colors, radius, spacing],
  );
  const {
    isDeleteConfirmationVisible,
    isDeleting,
    isError,
    isLoading,
    isNotFound,
    isRefreshing,
    onBack,
    onDelete,
    onEdit,
    onHideDeleteConfirmation,
    onRefresh,
    onRetry,
    onShowDeleteConfirmation,
    report,
  } = useReportDetailsViewPresenter({
    reportId: route.params.reportId,
    t,
  });

  if (isLoading) {
    return (
      <ScreenContainer
        containerStyle={styles.centered}
        headerComponent={
          <ReportsHeader onBack={onBack} title={String(t('reports.details.title'))} />
        }
      >
        <Loader size="large" />
      </ScreenContainer>
    );
  }

  if (isNotFound || isError || !report) {
    return (
      <ScreenContainer
        containerStyle={styles.centered}
        headerComponent={
          <ReportsHeader onBack={onBack} title={String(t('reports.details.title'))} />
        }
      >
        <Typography align="center" variant="heading">
          {t(isNotFound ? 'reports.details.notFoundTitle' : 'reports.details.errorTitle')}
        </Typography>
        <Typography align="center" color={colors.textSecondary}>
          {t(
            isNotFound
              ? 'reports.details.notFoundDescription'
              : 'reports.details.errorDescription',
          )}
        </Typography>
        {isNotFound ? (
          <Button onPress={onBack} title={String(t('common.back'))} />
        ) : (
          <Button onPress={onRetry} title={String(t('common.retry'))} />
        )}
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer
        contentContainerStyle={styles.content}
        headerComponent={
          <ReportsHeader onBack={onBack} title={String(t('reports.details.title'))} />
        }
        refreshControl={
          <RefreshControl
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        scrollEnabled
      >
        <View style={styles.card}>
          <Typography selectable variant="title">
            {report.title}
          </Typography>
          <ReportStatusBadge status={report.status} />
          <View>
            <Typography color={colors.textSecondary} variant="caption">
              {t('reports.form.notes')}
            </Typography>
            <Typography selectable style={styles.notes}>
              {report.notes || t('reports.details.noNotes')}
            </Typography>
          </View>
          <View style={styles.dateRow}>
            <Typography color={colors.textSecondary} variant="caption">
              {t('reports.details.createdAt')}
            </Typography>
            <Typography>{formatLocalizedDate(report.createdAt, language)}</Typography>
          </View>
          <View style={styles.dateRow}>
            <Typography color={colors.textSecondary} variant="caption">
              {t('reports.details.updatedAt')}
            </Typography>
            <Typography>{formatLocalizedDate(report.updatedAt, language)}</Typography>
          </View>
          <View style={styles.actions}>
            <Button
              onPress={onEdit}
              title={String(t('reports.edit.action'))}
              variant="secondary"
            />
            <Button
              onPress={onShowDeleteConfirmation}
              title={String(t('reports.delete.action'))}
              variant="danger"
            />
          </View>
        </View>
      </ScreenContainer>
      <DeleteReportModal
        isDeleting={isDeleting}
        onCancel={onHideDeleteConfirmation}
        onConfirm={onDelete}
        visible={isDeleteConfirmationVisible}
      />
    </>
  );
};
