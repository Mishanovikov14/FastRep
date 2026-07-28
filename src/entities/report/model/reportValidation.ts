import type {
  ICreateReportRequest,
  IUpdateReportRequest,
} from '@/entities/report/types/report';

export const REPORT_TITLE_MAX_LENGTH = 120;
export const REPORT_NOTES_MAX_LENGTH = 50_000;

export type ReportFormErrors = Partial<Record<'notes' | 'title', ReportValidationError>>;
export type ReportValidationError = 'notesMax' | 'titleMax' | 'titleRequired';

interface IReportFormValues {
  notes: string;
  title: string;
}

export const validateReportForm = ({
  notes,
  title,
}: IReportFormValues): ReportFormErrors => {
  const errors: ReportFormErrors = {};
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    errors.title = 'titleRequired';
  } else if (trimmedTitle.length > REPORT_TITLE_MAX_LENGTH) {
    errors.title = 'titleMax';
  }

  if (notes.trim().length > REPORT_NOTES_MAX_LENGTH) {
    errors.notes = 'notesMax';
  }

  return errors;
};

export const normalizeCreateReportRequest = ({
  notes,
  title,
}: IReportFormValues): ICreateReportRequest => {
  const trimmedNotes = notes.trim();

  return {
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    title: title.trim(),
  };
};

export const normalizeUpdateReportRequest = ({
  notes,
  title,
}: IReportFormValues): IUpdateReportRequest => {
  return {
    notes: notes.trim(),
    title: title.trim(),
  };
};
