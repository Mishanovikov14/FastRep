import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeUpdateReportRequest, validateReportForm } from '@/entities/report/model/reportValidation';
import type { ReportFormErrors } from '@/entities/report/model/reportValidation';
import { toastService } from '@/libs/toast/toastService';
import type { AppStackParamList } from '@/navigation/types';
import { getReportErrorMessage, getReportFieldErrors } from '@/modules/reports/presenters/reportErrors';
import { useReportDetailsQuery, useUpdateReportMutation } from '@/modules/reports/presenters/reportQueries';

type Navigation = NativeStackNavigationProp<AppStackParamList, 'EditReport'>;

interface IInput {
  reportId: string;
  t: TFunction;
}

export const useEditReportViewPresenter = ({ reportId, t }: IInput) => {
  const navigation = useNavigation<Navigation>();
  const reportQuery = useReportDetailsQuery(reportId);
  const mutation = useUpdateReportMutation(reportId);
  const initializedReportIdRef = useRef<string | undefined>(undefined);
  const isSubmittingRef = useRef(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<ReportFormErrors>({});

  useEffect(() => {
    if (reportQuery.data && initializedReportIdRef.current !== reportQuery.data.id) {
      initializedReportIdRef.current = reportQuery.data.id;
      setTitle(reportQuery.data.title);
      setNotes(reportQuery.data.notes ?? '');
    }
  }, [reportQuery.data]);

  const onChangeTitle = useCallback((value: string) => {
    setTitle(value);
    setErrors((current) => ({ ...current, title: undefined }));
  }, []);

  const onChangeNotes = useCallback((value: string) => {
    setNotes(value);
    setErrors((current) => ({ ...current, notes: undefined }));
  }, []);

  const onRetry = useCallback(async () => {
    await reportQuery.refetch();
  }, [reportQuery]);

  const onSubmit = useCallback(async () => {
    if (isSubmittingRef.current) {
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
    } catch (error: unknown) {
      console.error('Unexpected report update failure', error);
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isSubmittingRef.current = false;
    }
  }, [mutation, navigation, notes, t, title]);

  return {
    errors,
    isError: reportQuery.isError,
    isLoading: reportQuery.isPending,
    isSubmitting: mutation.isPending,
    notes,
    onChangeNotes,
    onChangeTitle,
    onRetry,
    onSubmit,
    title,
  };
};
