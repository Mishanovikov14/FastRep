import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { v4 as uuidv4 } from 'uuid';

import type { IReport } from '@/entities/report/types/report';
import {
  refreshGenerationResources,
  useCancelReportGenerationMutation,
  useEntitlementsQuery,
  useLatestReportGenerationQuery,
  useReportOutputQuery,
  useStartReportGenerationMutation,
} from '@/modules/reports/presenters/reportGenerationQueries';
import { useReportGenerationPresenter } from '@/modules/reports/ui/ReportDetailsView/presenters/useReportGenerationPresenter';

const uuidV4Mock = uuidv4 as unknown as jest.MockedFunction<() => string>;

jest.mock('@/modules/reports/presenters/reportGenerationQueries', () => ({
  refreshGenerationResources: jest.fn(),
  useCancelReportGenerationMutation: jest.fn(),
  useEntitlementsQuery: jest.fn(),
  useLatestReportGenerationQuery: jest.fn(),
  useReportOutputQuery: jest.fn(),
  useStartReportGenerationMutation: jest.fn(),
}));
jest.mock('@/entities/report/services/reportOutputService', () => ({
  openReportOutput: jest.fn(),
  shareReportOutput: jest.fn(),
}));

const t = ((key: string) => key) as unknown as TFunction;
const report: IReport = {
  createdAt: '2026-08-11T10:00:00.000Z',
  id: 'report-1',
  notes: 'Roof notes',
  status: 'DRAFT',
  title: 'Roof review',
  updatedAt: '2026-08-11T10:00:00.000Z',
};
const generation = {
  createdAt: '2026-08-11T10:00:00.000Z',
  id: 'generation-1',
  progress: 0,
  reportId: report.id,
  status: 'QUEUED' as const,
  updatedAt: '2026-08-11T10:00:00.000Z',
};

describe('report generation idempotency', () => {
  const mutateAsync = jest.fn();
  let presenter: ReturnType<typeof useReportGenerationPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  beforeEach(async () => {
    jest.clearAllMocks();
    uuidV4Mock.mockReset();
    jest.mocked(refreshGenerationResources).mockResolvedValue(undefined);
    jest.mocked(useEntitlementsQuery).mockReturnValue({
      data: {
        canGenerate: true,
        generationCredits: { available: 3, monthly: 3, purchased: 0 },
        subscription: null,
      },
    } as never);
    jest.mocked(useLatestReportGenerationQuery).mockReturnValue({ data: null, refetch: jest.fn() } as never);
    jest.mocked(useReportOutputQuery).mockReturnValue({ data: null } as never);
    jest.mocked(useCancelReportGenerationMutation).mockReturnValue({ isPending: false, mutateAsync: jest.fn() } as never);
    jest.mocked(useStartReportGenerationMutation).mockReturnValue({ isPending: false, mutateAsync } as never);

    const Harness = () => {
      presenter = useReportGenerationPresenter({
        hasReadyAssets: false,
        hasUnresolvedAssets: false,
        report,
        t,
      });

      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => renderer?.unmount());
  });

  it('reuses the key after an uncertain network result', async () => {
    uuidV4Mock.mockReturnValueOnce('network-key');
    mutateAsync
      .mockResolvedValueOnce({ isError: true, message: 'Network unavailable', type: 'network_error' })
      .mockResolvedValueOnce({ data: generation, isError: false, message: '' });

    await ReactTestRenderer.act(async () => {
      await presenter?.onStartGeneration();
      await presenter?.onStartGeneration();
    });

    expect(mutateAsync).toHaveBeenNthCalledWith(1, 'network-key');
    expect(mutateAsync).toHaveBeenNthCalledWith(2, 'network-key');
    expect(uuidv4).toHaveBeenCalledTimes(1);
  });

  it('clears the key after a deterministic local exception', async () => {
    uuidV4Mock.mockReturnValueOnce('local-key').mockReturnValueOnce('fresh-key');
    mutateAsync
      .mockRejectedValueOnce(new Error('request_config_failed'))
      .mockResolvedValueOnce({ data: generation, isError: false, message: '' });

    await ReactTestRenderer.act(async () => {
      await presenter?.onStartGeneration();
      await presenter?.onStartGeneration();
    });

    expect(mutateAsync).toHaveBeenNthCalledWith(1, 'local-key');
    expect(mutateAsync).toHaveBeenNthCalledWith(2, 'fresh-key');
  });

  it('clears the key after a deterministic backend failure', async () => {
    uuidV4Mock.mockReturnValueOnce('rejected-key').mockReturnValueOnce('next-key');
    mutateAsync
      .mockResolvedValueOnce({
        code: 'REPORT_HAS_NO_CONTENT',
        isError: true,
        message: 'Report has no content',
        status: 400,
      })
      .mockResolvedValueOnce({ data: generation, isError: false, message: '' });

    await ReactTestRenderer.act(async () => {
      await presenter?.onStartGeneration();
      await presenter?.onStartGeneration();
    });

    expect(mutateAsync).toHaveBeenNthCalledWith(1, 'rejected-key');
    expect(mutateAsync).toHaveBeenNthCalledWith(2, 'next-key');
  });

  it('uses a fresh key for an explicit new regeneration', async () => {
    uuidV4Mock.mockReturnValueOnce('first-generation-key').mockReturnValueOnce('regeneration-key');
    mutateAsync.mockResolvedValue({ data: generation, isError: false, message: '' });

    await ReactTestRenderer.act(async () => {
      await presenter?.onStartGeneration();
      await presenter?.onStartGeneration();
    });

    expect(mutateAsync).toHaveBeenNthCalledWith(1, 'first-generation-key');
    expect(mutateAsync).toHaveBeenNthCalledWith(2, 'regeneration-key');
  });
});
