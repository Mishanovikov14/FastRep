import { useCallback, useMemo } from 'react';
import { FlatList, View } from 'react-native';

import type { IReport } from '@/entities/report/types/report';
import { ReportCard } from '@/modules/reports/ui/components/ReportCard';
import { ReportsHeader } from '@/modules/reports/ui/components/ReportsHeader';
import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useReportsListViewPresenter } from './presenters/useReportsListViewPresenter';
import { getStyles } from './styles';

export const ReportsListView = () => {
  const { colors, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(spacing), [spacing]);
  const {
    errorMessage,
    isError,
    isLoading,
    isLoadingNextPage,
    isLoggingOut,
    isRefreshing,
    onCreateReport,
    onLoadMore,
    onLogout,
    onOpenReport,
    onRefresh,
    onRetry,
    reports,
  } = useReportsListViewPresenter({ t });

  const keyExtractor = useCallback((report: IReport) => report.id, []);
  const renderItem = useCallback(
    ({ item }: { item: IReport }) => (
      <ReportCard onPress={onOpenReport} report={item} />
    ),
    [onOpenReport],
  );
  const renderFooter = useCallback(
    () =>
      isLoadingNextPage ? (
        <View style={styles.footer}>
          <Loader />
        </View>
      ) : null,
    [isLoadingNextPage, styles.footer],
  );
  const renderEmpty = useCallback(
    () => (
      <View style={styles.centered}>
        <Typography align="center" variant="heading">
          {t('reports.list.emptyTitle')}
        </Typography>
        <Typography
          align="center"
          color={colors.textSecondary}
          style={styles.description}
        >
          {t('reports.list.emptyDescription')}
        </Typography>
        <Button
          onPress={onCreateReport}
          title={String(t('reports.create.action'))}
        />
      </View>
    ),
    [colors.textSecondary, onCreateReport, styles.centered, styles.description, t],
  );

  if (isLoading) {
    return (
      <ScreenContainer
        containerStyle={styles.centered}
        headerComponent={
          <ReportsHeader
            isLeadingActionLoading={isLoggingOut}
            leadingActionTitle={String(t('home.logout'))}
            onLeadingAction={onLogout}
            title={String(t('reports.list.title'))}
          />
        }
      >
        <Loader size="large" />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer
        containerStyle={styles.centered}
        headerComponent={
          <ReportsHeader
            actionTitle={String(t('reports.create.action'))}
            isLeadingActionLoading={isLoggingOut}
            leadingActionTitle={String(t('home.logout'))}
            onAction={onCreateReport}
            onLeadingAction={onLogout}
            title={String(t('reports.list.title'))}
          />
        }
      >
        <Typography align="center" variant="heading">
          {t('reports.list.errorTitle')}
        </Typography>
        <Typography
          align="center"
          color={colors.textSecondary}
          style={styles.description}
        >
          {errorMessage}
        </Typography>
        <Button onPress={onRetry} title={String(t('common.retry'))} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      containerStyle={styles.container}
      headerComponent={
        <ReportsHeader
          actionTitle={String(t('reports.create.action'))}
          isLeadingActionLoading={isLoggingOut}
          leadingActionTitle={String(t('home.logout'))}
          onAction={onCreateReport}
          onLeadingAction={onLogout}
          title={String(t('reports.list.title'))}
        />
      }
    >
      <FlatList
        contentContainerStyle={styles.list}
        data={reports}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.35}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
};
