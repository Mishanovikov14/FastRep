import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useMemo, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import { getReportDisplayTitle } from '@/entities/report/model/reportDisplayNames';
import { logger } from '@/libs/logger/logger';
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
import { useReportAttachmentAccessPresenter } from './useReportAttachmentAccessPresenter';
import { useReportGenerationPresenter } from './useReportGenerationPresenter';

type Navigation = NativeStackNavigationProp<AppStackParamList, 'ReportDetails'>;

interface IInput {
  language: SupportedLanguage;
  reportId: string;
  t: TFunction;
}

export const useReportDetailsViewPresenter = ({ language, reportId, t }: IInput) => {
  const navigation = useNavigation<Navigation>();
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const attachmentsOffsetRef = useRef(0);
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
  const attachmentAccess = useReportAttachmentAccessPresenter({
    assets: attachments.assets,
    onDeleteAsset: attachments.onRemoveServerAsset,
    reportId,
    t,
  });
  const onAttachmentsLayout = useCallback((event: LayoutChangeEvent) => {
    attachmentsOffsetRef.current = event.nativeEvent.layout.y;
  }, []);
  const onRejectedAssetsBlocked = useCallback(() => {
    scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, attachmentsOffsetRef.current - 16) });
  }, []);
  const generation = useReportGenerationPresenter({
    hasReadyAssets: attachments.hasReadyAssets,
    hasRejectedAssets: attachments.hasRejectedAssets,
    hasUnresolvedAssets: attachments.hasUnresolvedAssets,
    onRejectedAssetsBlocked,
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
    } catch {
      logger.error('report.deletion_failed', { errorCode: 'unexpected_error' });
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
  const reportTitle = getReportDisplayTitle(query.data?.title ?? '', String(t('reports.fallbackTitle')));

  return {
    attachments,
    attachmentAccess,
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
    onAttachmentsLayout,
    onRetry,
    onShowDeleteConfirmation,
    report: query.data,
    reportTitle,
    scrollRef,
    generation,
    updatedAtLabel,
  };
};
