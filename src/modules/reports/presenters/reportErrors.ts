import type { TFunction } from 'i18next';

import type { ReportFormErrors } from '@/entities/report/model/reportValidation';
import type { IResponse } from '@/libs/requester/IResponse';

type ReportErrorResponse = Pick<IResponse<unknown>, 'errors' | 'message' | 'status' | 'type'>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getFirstString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  }

  return undefined;
};

export const getReportFieldErrors = (errors: unknown): ReportFormErrors => {
  if (!isRecord(errors)) {
    return {};
  }

  const source = isRecord(errors.errors) ? errors.errors : errors;
  const result: ReportFormErrors = {};

  if (getFirstString(source.title)) {
    result.title = 'titleRequired';
  }

  if (getFirstString(source.notes)) {
    result.notes = 'notesMax';
  }

  return result;
};

export const getReportErrorMessage = (response: ReportErrorResponse, t: TFunction): string => {
  if (response.status === 404) {
    return String(t('reports.errors.notFound'));
  }

  if (response.status === 400 || response.status === 422) {
    return response.message || String(t('reports.errors.validation'));
  }

  if (response.type === 'network_error') {
    return String(t('reports.errors.network'));
  }

  if (response.type === 'timeout_error') {
    return String(t('reports.errors.timeout'));
  }

  if (response.status !== undefined && response.status >= 500) {
    return String(t('reports.errors.server'));
  }

  return String(t('common.somethingWentWrong'));
};
