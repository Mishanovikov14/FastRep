import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeUpdateReportRequest, validateReportForm } from '@/entities/report/model/reportValidation';
import type { ReportFormErrors } from '@/entities/report/model/reportValidation';
import { isReportSourceEditable } from '@/entities/report/model/reportGenerationState';
import { logger } from '@/libs/logger/logger';
import { toastService } from '@/libs/toast/toastService';
import type { AppStackParamList } from '@/navigation/types';
import { getReportErrorMessage, getReportFieldErrors } from '@/modules/reports/presenters/reportErrors';
import { useReportDetailsQuery, useUpdateReportMutation } from '@/modules/reports/presenters/reportQueries';
import { useLatestReportGenerationQuery } from '@/modules/reports/presenters/reportGenerationQueries';

type Navigation = NativeStackNavigationProp<AppStackParamList, 'EditReport'>;

interface IInput {
  reportId: string;
  t: TFunction;
}

export const useEditReportViewPresenter = ({ reportId, t }: IInput) => {
  const navigation = useNavigation<Navigation>();
  const reportQuery = useReportDetailsQuery(reportId);
  const latestGenerationQuery = useLatestReportGenerationQuery(reportId);
  const mutation = useUpdateReportMutation(reportId);
  const initializedReportIdRef = useRef<string | undefined>(undefined);
  const isSubmittingRef = useRef(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<ReportFormErrors>({});
  const isEditable = reportQuery.data
    ? !latestGenerationQuery.isPending &&
      !latestGenerationQuery.isError &&
      isReportSourceEditable(reportQuery.data.status, latestGenerationQuery.data)
    : false;

  useEffect(() => {
    if (reportQuery.data && initializedReportIdRef.current !== reportQuery.data.id) {
      initializedReportIdRef.current = reportQuery.data.id;
      setTitle(reportQuery.data.title);
      setNotes(reportQuery.data.notes ?? '');
    }
  }, [reportQuery.data]);

  const onChangeTitle = useCallback(
    (value: string) => {
      if (!isEditable) {
        return;
      }
      setTitle(value);
      setErrors((current) => ({ ...current, title: undefined }));
    },
    [isEditable],
  );

  const onChangeNotes = useCallback(
    (value: string) => {
      if (!isEditable) {
        return;
      }
      setNotes(value);
      setErrors((current) => ({ ...current, notes: undefined }));
    },
    [isEditable],
  );

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onRetry = useCallback(async () => {
    await reportQuery.refetch();
  }, [reportQuery]);

  const onSubmit = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }
    if (!isEditable) {
      logger.warn('report.update_blocked', {
        errorCode: 'REPORT_NOT_EDITABLE',
        reportStatus: reportQuery.data?.status,
      });
      return;
    }

    const validationErrors = validateReportForm({ notes, title });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    isSubmittingRef.current = true;

    try {
      const response = await mutation.mutateAsync(normalizeUpdateReportRequest({ notes, title }));

      if (response.isError || !response.data) {
        const fieldErrors = getReportFieldErrors(response.errors);

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }

        toastService.showError(String(t('common.error')), getReportErrorMessage(response, t));
        return;
      }

      toastService.showSuccess(String(t('reports.edit.success')));
      navigation.goBack();
    } catch {
      logger.error('report.update_failed', { errorCode: 'unexpected_error' });
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isSubmittingRef.current = false;
    }
  }, [isEditable, mutation, navigation, notes, reportQuery.data?.status, t, title]);

  return {
    errors,
    isError: reportQuery.isError,
    isEditable,
    isLoading: reportQuery.isPending,
    isSubmitting: mutation.isPending,
    notes,
    onChangeNotes,
    onChangeTitle,
    onBack,
    onRetry,
    onSubmit,
    title,
  };
};
