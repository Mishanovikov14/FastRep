import { startReportGeneration } from '@/entities/report/API/reportGenerationsApi';
import { reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';
import { isReportSourceEditable } from '@/entities/report/model/reportGenerationState';
import type { IReportGeneration } from '@/entities/report/types/reportGeneration';
import { queryClient } from '@/libs/query/QueryClient';
import { useStartReportGenerationMutation } from '@/modules/reports/presenters/reportGenerationQueries';
import { setReportStatusInLists } from '@/modules/reports/presenters/reportQueries';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((options: unknown) => options),
  useQuery: jest.fn(),
}));
jest.mock('@/entities/report/API/reportGenerationsApi', () => ({
  cancelReportGeneration: jest.fn(),
  getEntitlements: jest.fn(),
  getLatestReportGeneration: jest.fn(),
  getReportGeneration: jest.fn(),
  getReportOutput: jest.fn(),
  startReportGeneration: jest.fn(),
}));
jest.mock('@/libs/query/QueryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  },
}));
jest.mock('@/modules/reports/presenters/reportQueries', () => ({
  setReportStatusInLists: jest.fn(),
}));

interface IStartMutationOptions {
  mutationFn(idempotencyKey: string): ReturnType<typeof startReportGeneration>;
  onSuccess(response: Awaited<ReturnType<typeof startReportGeneration>>): void;
}

const queuedGeneration: IReportGeneration = {
  createdAt: '2026-08-19T10:00:00.000Z',
  id: 'generation-queued',
  progress: 0,
  reportId: 'report-1',
  status: 'QUEUED',
  updatedAt: '2026-08-19T10:00:00.000Z',
};

describe('start report generation mutation', () => {
  it('writes the queued generation to latest cache immediately after success', async () => {
    jest.mocked(startReportGeneration).mockResolvedValue({
      data: queuedGeneration,
      isError: false,
      message: '',
    });
    const mutation = useStartReportGenerationMutation('report-1') as unknown as IStartMutationOptions;
    const response = await mutation.mutationFn('idempotency-key');

    mutation.onSuccess(response);

    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      reportsQueryKeys.generationLatest('report-1'),
      queuedGeneration,
    );
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      reportsQueryKeys.generation('report-1', queuedGeneration.id),
      queuedGeneration,
    );
    expect(setReportStatusInLists).toHaveBeenCalledWith('report-1', 'QUEUED');
    const latestGeneration = jest.mocked(queryClient.setQueryData).mock.calls[0]?.[1] as
      | IReportGeneration
      | undefined;
    expect(isReportSourceEditable('DRAFT', latestGeneration)).toBe(false);
  });
});
