import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useCallback, useRef, useState } from 'react';

import { normalizeCreateReportRequest, validateReportForm } from '@/entities/report/model/reportValidation';
import type { ReportFormErrors } from '@/entities/report/model/reportValidation';
import { toastService } from '@/libs/toast/toastService';
import type { AppStackParamList } from '@/navigation/types';
import { getReportErrorMessage, getReportFieldErrors } from '@/modules/reports/presenters/reportErrors';
import { useCreateReportMutation } from '@/modules/reports/presenters/reportQueries';

type Navigation = NativeStackNavigationProp<AppStackParamList, 'CreateReport'>;

interface IInput {
  t: TFunction;
}

export const useCreateReportViewPresenter = ({ t }: IInput) => {
  const navigation = useNavigation<Navigation>();
  const mutation = useCreateReportMutation();
  const isSubmittingRef = useRef(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<ReportFormErrors>({});

  const onChangeTitle = useCallback((value: string) => {
    setTitle(value);
    setErrors((current) => ({ ...current, title: undefined }));
  }, []);

  const onChangeNotes = useCallback((value: string) => {
    setNotes(value);
    setErrors((current) => ({ ...current, notes: undefined }));
  }, []);

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
      const response = await mutation.mutateAsync(normalizeCreateReportRequest({ notes, title }));

      if (response.isError || !response.data) {
        const fieldErrors = getReportFieldErrors(response.errors);

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }

        toastService.showError(String(t('common.error')), getReportErrorMessage(response, t));
        return;
      }

      toastService.showSuccess(String(t('reports.create.success')));
      navigation.replace('ReportDetails', { reportId: response.data.id });
    } catch (error: unknown) {
      console.error('Unexpected report creation failure', error);
      toastService.showError(String(t('common.error')), String(t('common.somethingWentWrong')));
    } finally {
      isSubmittingRef.current = false;
    }
  }, [mutation, navigation, notes, t, title]);

  return {
    errors,
    isSubmitting: mutation.isPending,
    notes,
    onChangeNotes,
    onChangeTitle,
    onSubmit,
    title,
  };
};
