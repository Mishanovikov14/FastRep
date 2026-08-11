import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useMemo } from 'react';

import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import type { SupportedLanguage } from '@/localization/types';
import { toastService } from '@/libs/toast/toastService';
import type { AppStackParamList } from '@/navigation/types';
import {
  removeReportDetailsCache,
  useDeleteReportMutation,
  useReportDetailsQuery,
} from '@/modules/reports/presenters/reportQueries';
import { getReportErrorMessage } from '@/modules/reports/presenters/reportErrors';
import { useCustomAlert } from '@/UIKit/CustomAlert/presenters/useCustomAlert';
import type { ICustomAlertAction } from '@/UIKit/CustomAlert/types';
import { formatLocalizedDate } from '@/utils/formatLocalizedDate';

import { useReportAttachmentsPresenter } from './useReportAttachmentsPresenter';
import { useReportGenerationPresenter } from './useReportGenerationPresenter';

type Navigation = NativeStackNavigationProp<AppStackParamList, 'ReportDetails'>;

interface IInput {
  language: SupportedLanguage;
  reportId: string;
  t: TFunction;
}

export const useReportDetailsViewPresenter = ({ language, reportId, t }: IInput) => {
  const navigation = useNavigation<Navigation>();
  const query = useReportDetailsQuery(reportId);
  const deleteMutation = useDeleteReportMutation(reportId);
  const {
    isVisible: isDeleteConfirmationVisible,
    onHide: onHideDeleteAlert,
    onShow: onShowDeleteAlert,
  } = useCustomAlert();
  const reportForGeneration = query.data ?? {
    createdAt: '',
    id: reportId,
    notes: '',
    status: 'DRAFT' as const,
    title: '',
    updatedAt: '',
  };
  const canEditSources = query.data?.status === 'DRAFT' || query.data?.status === 'FAILED';
  const attachments = useReportAttachmentsPresenter({ canEdit: canEditSources, reportId, t });
  const generation = useReportGenerationPresenter({
    hasReadyAssets: attachments.hasReadyAssets,
    hasUnresolvedAssets: attachments.hasUnresolvedAssets,
    report: reportForGeneration,
    t,
  });

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
    onShowDeleteAlert();
  }, [onShowDeleteAlert]);

  const onHideDeleteConfirmation = useCallback(() => {
    if (!deleteMutation.isPending) {
      onHideDeleteAlert();
    }
  }, [deleteMutation.isPending, onHideDeleteAlert]);

  const onDelete = useCallback(async () => {
    if (deleteMutation.isPending) {
      return;
    }

    try {
      const response = await deleteMutation.mutateAsync();

      if (response.isError && response.status !== 404) {
        toastService.showError(String(t('common.error')), getReportErrorMessage(response, t));
        return;
      }

      onHideDeleteAlert();
      toastService.showSuccess(
        String(t(response.status === 404 ? 'reports.delete.alreadyDeleted' : 'reports.delete.success')),
      );
      navigation.popTo('Tabs', { screen: 'Reports' });
      removeReportDetailsCache(reportId);
    } catch (error: unknown) {
      console.error('Unexpected report deletion failure', error);
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    }
  }, [deleteMutation, navigation, onHideDeleteAlert, reportId, t]);

  const isNotFound = query.error instanceof ReportRequestError && query.error.status === 404;
  const deleteActions = useMemo<ICustomAlertAction[]>(
    () => [
      {
        disabled: deleteMutation.isPending,
        key: 'cancel',
        onPress: onHideDeleteConfirmation,
        title: String(t('common.cancel')),
        variant: 'secondary',
      },
      {
        key: 'delete',
        loading: deleteMutation.isPending,
        onPress: onDelete,
        title: String(t('reports.delete.action')),
        variant: 'danger',
      },
    ],
    [deleteMutation.isPending, onDelete, onHideDeleteConfirmation, t],
  );
  const createdAtLabel = useMemo(
    () => (query.data ? formatLocalizedDate(query.data.createdAt, language) : undefined),
    [language, query.data],
  );
  const updatedAtLabel = useMemo(
    () => (query.data ? formatLocalizedDate(query.data.updatedAt, language) : undefined),
    [language, query.data],
  );

  return {
    attachments,
    createdAtLabel,
    deleteActions,
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
    generation,
    updatedAtLabel,
  };
};
