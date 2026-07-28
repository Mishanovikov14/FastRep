import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { ReportStatusBadge } from '@/modules/reports/ui/components/ReportStatusBadge';
import type { AppStackParamList } from '@/navigation/types';
import { Button } from '@/UIKit/Button';
import { CustomAlert } from '@/UIKit/CustomAlert';
import { Header } from '@/UIKit/Header';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useReportDetailsViewPresenter } from './presenters/useReportDetailsViewPresenter';
import { getStyles } from './styles';

export const ReportDetailsView = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'ReportDetails'>>();
  const { colors, language, radius, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);
  const {
    createdAtLabel,
    deleteActions,
    isDeleteConfirmationVisible,
    isError,
    isLoading,
    isNotFound,
    isRefreshing,
    onBack,
    onEdit,
    onHideDeleteConfirmation,
    onRefresh,
    onRetry,
    onShowDeleteConfirmation,
    report,
    updatedAtLabel,
  } = useReportDetailsViewPresenter({
    language,
    reportId: route.params.reportId,
    t,
  });
  const isContentVisible = !isLoading && !isNotFound && !isError && Boolean(report);

  return (
    <>
      <ScreenContainer
        containerStyle={isContentVisible ? undefined : styles.centered}
        contentContainerStyle={isContentVisible ? styles.content : undefined}
        edges={['bottom']}
        headerComponent={<Header showBackButton title={String(t('reports.details.title'))} />}
        refreshControl={
          isContentVisible ? (
            <RefreshControl onRefresh={onRefresh} refreshing={isRefreshing} tintColor={colors.primary} />
          ) : undefined
        }
        scrollEnabled={isContentVisible}
      >
        {isLoading ? (
          <Loader size="large" />
        ) : isNotFound || isError || !report ? (
          <>
            <Typography align="center" variant="heading">
              {t(isNotFound ? 'reports.details.notFoundTitle' : 'reports.details.errorTitle')}
            </Typography>
            <Typography align="center" color={colors.textSecondary}>
              {t(isNotFound ? 'reports.details.notFoundDescription' : 'reports.details.errorDescription')}
            </Typography>
            {isNotFound ? (
              <Button onPress={onBack} title={String(t('common.back'))} />
            ) : (
              <Button onPress={onRetry} title={String(t('common.retry'))} />
            )}
          </>
        ) : (
          <View style={styles.card}>
            <Typography selectable variant="heading">
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
              <Typography>{createdAtLabel}</Typography>
            </View>
            <View style={styles.dateRow}>
              <Typography color={colors.textSecondary} variant="caption">
                {t('reports.details.updatedAt')}
              </Typography>
              <Typography>{updatedAtLabel}</Typography>
            </View>
            <View style={styles.actions}>
              <Button
                onPress={onEdit}
                style={styles.action}
                title={String(t('reports.edit.action'))}
                variant="secondary"
              />
              <Button
                onPress={onShowDeleteConfirmation}
                style={styles.action}
                title={String(t('reports.delete.action'))}
                variant="danger"
              />
            </View>
          </View>
        )}
      </ScreenContainer>
      <CustomAlert
        actions={deleteActions}
        description={String(t('reports.delete.confirmation'))}
        onDismiss={onHideDeleteConfirmation}
        title={String(t('reports.delete.title'))}
        visible={isDeleteConfirmationVisible}
      />
    </>
  );
};
