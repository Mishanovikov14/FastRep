import type { ReportStatus } from '@/entities/report/types/report';
import type { IReportGeneration } from '@/entities/report/types/reportGeneration';

type GenerationState = Pick<IReportGeneration, 'status'> | null | undefined;

export const isReportGenerationActive = (generation: GenerationState): boolean =>
  generation?.status === 'QUEUED' || generation?.status === 'PROCESSING';

export const getEffectiveReportStatus = (
  reportStatus: ReportStatus,
  generation: GenerationState,
): ReportStatus => {
  switch (generation?.status) {
    case 'QUEUED':
      return 'QUEUED';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'FAILED':
      return reportStatus === 'READY' ? 'READY' : 'FAILED';
    case 'COMPLETED':
      return 'READY';
    default:
      return reportStatus;
  }
};

export const isReportSourceEditable = (
  reportStatus: ReportStatus,
  generation: GenerationState,
): boolean => {
  const effectiveStatus = getEffectiveReportStatus(reportStatus, generation);

  return (
    (effectiveStatus === 'DRAFT' || effectiveStatus === 'FAILED') &&
    !isReportGenerationActive(generation)
  );
};
