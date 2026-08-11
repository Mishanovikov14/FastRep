import { getReportOutputShareFileName } from '@/entities/report/services/reportOutputService';

describe('report output share filename', () => {
  it('preserves a Ukrainian title', () => {
    expect(getReportOutputShareFileName('Огляд даху серпень')).toBe('FastRep - Огляд даху серпень.pdf');
  });

  it('preserves a Latin title and normalizes whitespace', () => {
    expect(getReportOutputShareFileName('  August\n Roof   Review  ')).toBe('FastRep - August Roof Review.pdf');
  });

  it('removes invalid filename characters', () => {
    expect(getReportOutputShareFileName('Roof: east/west <final>?*')).toBe('FastRep - Roof eastwest final.pdf');
  });

  it.each(['', '  ', '<>:"/\\|?*'])('uses the fallback for an empty or only-invalid title', (title) => {
    expect(getReportOutputShareFileName(title)).toBe('FastRep - Report.pdf');
  });
});
