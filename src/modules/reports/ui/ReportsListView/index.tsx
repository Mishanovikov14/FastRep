import { useMemo } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IReport } from '@/entities/report/types/report';
import { ReportsIcon } from '@/assets/icons/ReportsIcon';
import { Button } from '@/UIKit/Button';
import { EmptyState } from '@/UIKit/EmptyState';
import { Header } from '@/UIKit/Header';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { ReportCard } from './components/ReportCard';
import { useReportsListViewPresenter } from './presenters/useReportsListViewPresenter';
import { getStyles } from './styles';

const keyExtractor = (report: IReport) => report.id;

export const ReportsListView = () => {
  const { colors, spacing, t } = useUIContext();
  const { bottom } = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors, spacing, bottom), [bottom, colors, spacing]);
  const {
    errorMessage,
    isError,
    isLoading,
    isLoadingNextPage,
    isRefreshing,
    onCreateReport,
    onLoadMore,
    onOpenReport,
    onRefresh,
    onRetry,
    reports,
  } = useReportsListViewPresenter({ t });

  const renderItem = ({ item }: ListRenderItemInfo<IReport>) => {
    return <ReportCard onPress={onOpenReport} report={item} />;
  };
  const renderFooter = () => {
    return isLoadingNextPage ? (
      <View style={styles.footer}>
        <Loader />
      </View>
    ) : null;
  };
  const renderEmpty = () => {
    return (
      <View style={styles.empty}>
        <EmptyState
          description={String(t('reports.list.emptyDescription'))}
          image={<ReportsIcon color={colors.primary} height={96} width={96} />}
          title={String(t('reports.list.emptyTitle'))}
        />
      </View>
    );
  };

  return (
    <ScreenContainer
      containerStyle={styles.container}
      edges={[]}
      headerComponent={<Header title={String(t('reports.list.title'))} />}
    >
      {isLoading ? (
        <View style={styles.centered}>
          <Loader size="large" />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Typography align="center" variant="heading">
            {t('reports.list.errorTitle')}
          </Typography>
          <Typography align="center" color={colors.textSecondary}>
            {errorMessage}
          </Typography>
          <Button onPress={onRetry} title={String(t('common.retry'))} />
        </View>
      ) : (
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
      )}
      <View style={styles.bottomAction}>
        <Button
          fullWidth
          onPress={onCreateReport}
          size="large"
          style={styles.action}
          title={String(t('reports.create.action'))}
        />
      </View>
    </ScreenContainer>
  );
};
