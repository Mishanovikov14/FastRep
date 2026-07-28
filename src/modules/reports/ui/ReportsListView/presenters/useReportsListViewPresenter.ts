import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TFunction } from 'i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { IReport } from '@/entities/report/types/report';
import { toastService } from '@/libs/toast/toastService';
import type { AppStackParamList, AppTabsParamList } from '@/navigation/types';
import { refreshReportsFirstPage, useReportsListQuery } from '@/modules/reports/presenters/reportQueries';
import { getReportErrorMessage } from '@/modules/reports/presenters/reportErrors';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Reports'>,
  NativeStackNavigationProp<AppStackParamList>
>;

interface IInput {
  t: TFunction;
}

export const useReportsListViewPresenter = ({ t }: IInput) => {
  const navigation = useNavigation<Navigation>();
  const isLoadingNextPageRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const query = useReportsListQuery();
  const reports = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);

  const onCreateReport = useCallback(() => {
    navigation.navigate('CreateReport');
  }, [navigation]);

  const onOpenReport = useCallback(
    (report: IReport) => {
      navigation.navigate('ReportDetails', { reportId: report.id });
    },
    [navigation],
  );

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      const response = await refreshReportsFirstPage();

      if (response.isError) {
        toastService.showError(String(t('common.error')), getReportErrorMessage(response, t));
      }
    } catch (error: unknown) {
      console.error('Unexpected reports refresh failure', error);
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [t]);

  const onRetry = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const onLoadMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage || isLoadingNextPageRef.current) {
      return;
    }

    isLoadingNextPageRef.current = true;

    try {
      await query.fetchNextPage();
    } finally {
      isLoadingNextPageRef.current = false;
    }
  }, [query]);

  return {
    errorMessage: query.error ? String(t('reports.list.errorDescription')) : undefined,
    isEmpty: !query.isPending && reports.length === 0,
    isError: query.isError && reports.length === 0,
    isLoading: query.isPending && reports.length === 0,
    isLoadingNextPage: query.isFetchingNextPage,
    isRefreshing,
    onCreateReport,
    onLoadMore,
    onOpenReport,
    onRefresh,
    onRetry,
    reports,
  };
};
