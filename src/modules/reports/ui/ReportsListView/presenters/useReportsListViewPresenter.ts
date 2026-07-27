import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef } from 'react';

import { reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';
import type { IReport } from '@/entities/report/types/report';
import { queryClient } from '@/libs/query/QueryClient';
import type { AppStackParamList } from '@/navigation/types';
import { useHomeViewPresenter } from '@/modules/home/ui/HomeView/presenters/useHomeViewPresenter';
import {
  REPORTS_PAGE_LIMIT,
  useReportsListQuery,
} from '@/modules/reports/presenters/reportQueries';

import type { IPresenterInput } from '../types';

type Navigation = NativeStackNavigationProp<AppStackParamList, 'ReportsList'>;

export const useReportsListViewPresenter = ({ t }: IPresenterInput) => {
  const navigation = useNavigation<Navigation>();
  const { isLoading: isLoggingOut, onLogout } = useHomeViewPresenter({ t });
  const isLoadingNextPageRef = useRef(false);
  const query = useReportsListQuery();
  const reports = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

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
    await queryClient.resetQueries({
      exact: true,
      queryKey: reportsQueryKeys.list(REPORTS_PAGE_LIMIT),
    });
  }, []);

  const onRetry = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const onLoadMore = useCallback(async () => {
    if (
      !query.hasNextPage ||
      query.isFetchingNextPage ||
      isLoadingNextPageRef.current
    ) {
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
    isEmpty: !query.isPending && !query.isError && reports.length === 0,
    isError: query.isError,
    isLoading: query.isPending,
    isLoadingNextPage: query.isFetchingNextPage,
    isLoggingOut,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    onCreateReport,
    onLoadMore,
    onLogout,
    onOpenReport,
    onRefresh,
    onRetry,
    reports,
  };
};
