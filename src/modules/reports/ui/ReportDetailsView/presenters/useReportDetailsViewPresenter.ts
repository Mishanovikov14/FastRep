import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import { getReportDisplayTitle } from '@/entities/report/model/reportDisplayNames';
import {
  getEffectiveReportStatus,
  isReportGenerationActive,
  isReportSourceEditable,
} from '@/entities/report/model/reportGenerationState';
import { logger } from '@/libs/logger/logger';
import type { SupportedLanguage } from '@/localization/types';
import { toastService } from '@/libs/toast/toastService';
import type { AppStackParamList } from '@/navigation/types';
import {
  removeReportDetailsCache,
  useDeleteReportMutation,
  useDuplicateReportMutation,
  useReportDetailsQuery,
} from '@/modules/reports/presenters/reportQueries';
import { useLatestReportGenerationQuery } from '@/modules/reports/presenters/reportGenerationQueries';
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
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const query = useReportDetailsQuery(reportId);
  const latestGenerationQuery = useLatestReportGenerationQuery(reportId);
  const refetchReport = query.refetch;
  const refetchLatestGeneration = latestGenerationQuery.refetch;
  const deleteMutation = useDeleteReportMutation(reportId);
  const duplicateMutation = useDuplicateReportMutation(reportId);
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
  const isGenerationStateReady = !latestGenerationQuery.isPending && !latestGenerationQuery.isError;
  const isGenerationActive = isReportGenerationActive(latestGenerationQuery.data);
  const canEditSources = query.data
    ? isGenerationStateReady && isReportSourceEditable(query.data.status, latestGenerationQuery.data)
    : false;
  const attachments = useReportAttachmentsPresenter({ canEdit: canEditSources, reportId, t });
  const attachmentAccess = useReportAttachmentAccessPresenter({
    assets: attachments.assets,
    canEdit: canEditSources,
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
  const onRefetchLatestGeneration = useCallback(async () => {
    await refetchLatestGeneration();
  }, [refetchLatestGeneration]);
  const generation = useReportGenerationPresenter({
    generation: latestGenerationQuery.data,
    hasReadyAssets: attachments.hasReadyAssets,
    hasRejectedAssets: attachments.hasRejectedAssets,
    hasUnresolvedAssets: attachments.hasUnresolvedAssets,
    isGenerationStateReady,
    onRefetchLatestGeneration,
    onRejectedAssetsBlocked,
    report: reportForGeneration,
    t,
  });

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onEdit = useCallback(() => {
    if (!canEditSources) {
      return;
    }
    navigation.navigate('EditReport', { reportId });
  }, [canEditSources, navigation, reportId]);

  const onDuplicate = useCallback(async () => {
    if (duplicateMutation.isPending || query.data?.status !== 'READY' || isGenerationActive) {
      return;
    }

    logger.info('report.duplicate_started', { reportStatus: query.data.status });
    try {
      const response = await duplicateMutation.mutateAsync();
      if (response.isError || !response.data) {
        logger.warn('report.duplicate_failed', {
          errorCode: response.code ?? response.type ?? 'request_failed',
          httpStatus: response.status,
          reportStatus: query.data.status,
        });
        toastService.showError(String(t('reports.duplicate.failed')), getReportErrorMessage(response, t));
        return;
      }

      navigation.push('ReportDetails', { reportId: response.data.id });
    } catch {
      logger.error('report.duplicate_failed', {
        errorCode: 'local_exception',
        reportStatus: query.data.status,
      });
      toastService.showError(String(t('reports.duplicate.failed')), String(t('common.somethingWentWrong')));
    }
  }, [duplicateMutation, isGenerationActive, navigation, query.data?.status, t]);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchReport(), refetchLatestGeneration()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchLatestGeneration, refetchReport]);

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
  const reportStatus = query.data
    ? getEffectiveReportStatus(query.data.status, latestGenerationQuery.data)
    : undefined;

  return {
    attachments,
    attachmentAccess,
    canEditSources,
    createdAtLabel,
    deleteActions,
    isDeleteConfirmationVisible,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isError: query.isError && !isNotFound,
    isLoading: query.isPending,
    isNotFound,
    isRefreshing: isManualRefreshing,
    onBack,
    onDelete,
    onEdit,
    onDuplicate,
    onHideDeleteConfirmation,
    onRefresh,
    onAttachmentsLayout,
    onRetry,
    onShowDeleteConfirmation,
    report: query.data,
    reportStatus,
    reportTitle,
    scrollRef,
    generation,
    updatedAtLabel,
  };
};
