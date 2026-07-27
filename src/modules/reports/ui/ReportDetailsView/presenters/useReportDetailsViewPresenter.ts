import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';

import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import { toastService } from '@/libs/toast/toastService';
import type { AppStackParamList } from '@/navigation/types';
import {
  useDeleteReportMutation,
  useReportDetailsQuery,
} from '@/modules/reports/presenters/reportQueries';
import { getReportErrorMessage } from '@/modules/reports/presenters/reportErrors';

import type { IPresenterInput } from '../types';

type Navigation = NativeStackNavigationProp<AppStackParamList, 'ReportDetails'>;

export const useReportDetailsViewPresenter = ({ reportId, t }: IPresenterInput) => {
  const navigation = useNavigation<Navigation>();
  const query = useReportDetailsQuery(reportId);
  const deleteMutation = useDeleteReportMutation(reportId);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onEdit = useCallback(() => {
    navigation.navigate('EditReport', { reportId });
  }, [navigation, reportId]);

  const onRefresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const onRetry = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const onShowDeleteConfirmation = useCallback(() => {
    setIsDeleteConfirmationVisible(true);
  }, []);

  const onHideDeleteConfirmation = useCallback(() => {
    if (!deleteMutation.isPending) {
      setIsDeleteConfirmationVisible(false);
    }
  }, [deleteMutation.isPending]);

  const onDelete = useCallback(async () => {
    if (deleteMutation.isPending) {
      return;
    }

    try {
      const response = await deleteMutation.mutateAsync();

      if (response.isError && response.status !== 404) {
        toastService.showError(
          String(t('common.error')),
          getReportErrorMessage(response, t),
        );
        return;
      }

      setIsDeleteConfirmationVisible(false);
      toastService.showSuccess(
        String(t('common.success')),
        String(
          t(response.status === 404 ? 'reports.delete.alreadyDeleted' : 'reports.delete.success'),
        ),
      );
      navigation.popTo('ReportsList');
    } catch (error: unknown) {
      console.error('Unexpected report deletion failure', error);
      toastService.showError(
        String(t('common.error')),
        String(t('common.somethingWentWrong')),
      );
    }
  }, [deleteMutation, navigation, t]);

  const isNotFound =
    query.error instanceof ReportRequestError && query.error.status === 404;

  return {
    isDeleteConfirmationVisible,
    isDeleting: deleteMutation.isPending,
    isError: query.isError && !isNotFound,
    isLoading: query.isPending,
    isNotFound,
    isRefreshing: query.isRefetching,
    onBack,
    onDelete,
    onEdit,
    onHideDeleteConfirmation,
    onRefresh,
    onRetry,
    onShowDeleteConfirmation,
    report: query.data,
  };
};
