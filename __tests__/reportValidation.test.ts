import {
  normalizeCreateReportRequest,
  normalizeUpdateReportRequest,
  REPORT_NOTES_MAX_LENGTH,
  REPORT_TITLE_MAX_LENGTH,
  validateReportForm,
} from '@/entities/report/model/reportValidation';

describe('report validation', () => {
  it('requires a non-whitespace title', () => {
    expect(validateReportForm({ notes: '', title: '   ' })).toEqual({
      title: 'titleRequired',
    });
  });

  it('limits the trimmed title to 120 characters', () => {
    expect(
      validateReportForm({
        notes: '',
        title: 'a'.repeat(REPORT_TITLE_MAX_LENGTH + 1),
      }),
    ).toEqual({ title: 'titleMax' });
  });

  it('limits trimmed notes to 50,000 characters', () => {
    expect(
      validateReportForm({
        notes: ` ${'a'.repeat(REPORT_NOTES_MAX_LENGTH + 1)} `,
        title: 'Title',
      }),
    ).toEqual({ notes: 'notesMax' });
  });

  it('trims create and update values and omits empty create notes', () => {
    expect(
      normalizeCreateReportRequest({ notes: '   ', title: '  Title  ' }),
    ).toEqual({ title: 'Title' });
    expect(
      normalizeUpdateReportRequest({
        notes: '  Updated notes  ',
        title: '  Updated title  ',
      }),
    ).toEqual({
      notes: 'Updated notes',
      title: 'Updated title',
    });
  });
});
