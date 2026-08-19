import {
  getEffectiveReportStatus,
  isReportGenerationActive,
  isReportSourceEditable,
} from '@/entities/report/model/reportGenerationState';
import type { IReportGeneration } from '@/entities/report/types/reportGeneration';

const generation = (status: IReportGeneration['status']): IReportGeneration => ({
  createdAt: '2026-08-19T10:00:00.000Z',
  id: `generation-${status}`,
  progress: 0,
  reportId: 'report-1',
  status,
  updatedAt: '2026-08-19T10:00:00.000Z',
});

describe('report generation state', () => {
  it.each(['QUEUED', 'PROCESSING'] as const)('%s is active and blocks source editing', (status) => {
    const latestGeneration = generation(status);

    expect(isReportGenerationActive(latestGeneration)).toBe(true);
    expect(isReportSourceEditable('DRAFT', latestGeneration)).toBe(false);
    expect(getEffectiveReportStatus('DRAFT', latestGeneration)).toBe(status);
  });

  it('FAILED restores source editing', () => {
    expect(isReportSourceEditable('DRAFT', generation('FAILED'))).toBe(true);
    expect(getEffectiveReportStatus('PROCESSING', generation('FAILED'))).toBe('FAILED');
  });

  it('keeps READY immutable even if the latest generation is failed', () => {
    expect(getEffectiveReportStatus('READY', generation('FAILED'))).toBe('READY');
    expect(isReportSourceEditable('READY', generation('FAILED'))).toBe(false);
  });

  it('COMPLETED switches to READY and remains immutable while report data refetches', () => {
    expect(getEffectiveReportStatus('DRAFT', generation('COMPLETED'))).toBe('READY');
    expect(isReportSourceEditable('DRAFT', generation('COMPLETED'))).toBe(false);
  });
});
