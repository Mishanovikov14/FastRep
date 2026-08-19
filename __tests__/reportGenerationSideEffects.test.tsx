import type { TFunction } from 'i18next';
import React from 'react';
import { AppState } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import type { IReport } from '@/entities/report/types/report';
import type { IReportGeneration } from '@/entities/report/types/reportGeneration';
import { logger as appLogger } from '@/libs/logger/logger';
import { toastService } from '@/libs/toast/toastService';
import {
  refreshGenerationResources,
  useCancelReportGenerationMutation,
  useEntitlementsQuery,
  useReportOutputQuery,
  useStartReportGenerationMutation,
} from '@/modules/reports/presenters/reportGenerationQueries';
import { useReportGenerationPresenter } from '@/modules/reports/ui/ReportDetailsView/presenters/useReportGenerationPresenter';

jest.mock('@/modules/reports/presenters/reportGenerationQueries', () => ({
  refreshGenerationResources: jest.fn(),
  useCancelReportGenerationMutation: jest.fn(),
  useEntitlementsQuery: jest.fn(),
  useReportOutputQuery: jest.fn(),
  useStartReportGenerationMutation: jest.fn(),
}));
jest.mock('@/entities/report/services/reportOutputService', () => ({
  ...jest.requireActual('@/entities/report/services/reportOutputService'),
  openReportOutput: jest.fn(),
  shareReportOutput: jest.fn(),
}));
jest.mock('@/libs/logger/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const t = ((key: string) => key) as unknown as TFunction;
const report: IReport = {
  createdAt: '2026-08-11T10:00:00.000Z',
  id: 'report-1',
  notes: 'Roof notes',
  status: 'PROCESSING',
  title: 'Roof review',
  updatedAt: '2026-08-11T10:00:00.000Z',
};
const createGeneration = (status: IReportGeneration['status']): IReportGeneration => ({
  createdAt: '2026-08-11T10:00:00.000Z',
  id: 'generation-1',
  progress: status === 'COMPLETED' ? 100 : 30,
  reportId: report.id,
  status,
  updatedAt: '2026-08-11T10:00:00.000Z',
});

describe('report generation side effects', () => {
  let currentGeneration: IReportGeneration | null;
  let currentReport: IReport;
  let presenter: ReturnType<typeof useReportGenerationPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  let appStateListener: ((state: string) => void) | undefined;
  let appStateSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let successSpy: jest.SpyInstance;

  const Harness = () => {
    presenter = useReportGenerationPresenter({
      generation: currentGeneration,
      hasReadyAssets: true,
      hasUnresolvedAssets: false,
      isGenerationStateReady: true,
      onRefetchLatestGeneration: jest.fn(async () => undefined),
      report: currentReport,
      t,
    });
    return null;
  };

  const render = async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
  };

  const rerender = async () => {
    await ReactTestRenderer.act(async () => {
      renderer?.update(<Harness />);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentGeneration = null;
    currentReport = report;
    jest.mocked(refreshGenerationResources).mockResolvedValue(undefined);
    jest
      .mocked(useEntitlementsQuery)
      .mockReturnValue({ data: { canGenerate: true, generationCredits: { available: 3 } } } as never);
    jest.mocked(useReportOutputQuery).mockReturnValue({ data: null } as never);
    jest
      .mocked(useCancelReportGenerationMutation)
      .mockReturnValue({ isPending: false, mutateAsync: jest.fn() } as never);
    jest.mocked(useStartReportGenerationMutation).mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn().mockResolvedValue({
        data: createGeneration('QUEUED'),
        isError: false,
        message: '',
      }),
    } as never);
    errorSpy = jest.spyOn(toastService, 'showError').mockImplementation(() => undefined);
    successSpy = jest.spyOn(toastService, 'showSuccess').mockImplementation(() => undefined);
    appStateSpy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type, listener) => {
      appStateListener = listener as (state: string) => void;
      return { remove: jest.fn() };
    }) as typeof AppState.addEventListener);
  });

  afterEach(() => {
    ReactTestRenderer.act(() => renderer?.unmount());
    renderer = undefined;
    errorSpy.mockRestore();
    successSpy.mockRestore();
    appStateSpy.mockRestore();
  });

  it('refreshes terminal resources without showing success for an initially loaded completed generation', async () => {
    currentGeneration = createGeneration('COMPLETED');
    await render();

    expect(successSpy).not.toHaveBeenCalled();
    expect(refreshGenerationResources).toHaveBeenCalledTimes(1);
  });

  it('refreshes terminal resources without emitting a failure toast for an initially loaded failed generation', async () => {
    currentGeneration = createGeneration('FAILED');
    await render();

    expect(errorSpy).not.toHaveBeenCalled();
    expect(refreshGenerationResources).toHaveBeenCalledTimes(1);
  });

  it('keeps an existing processing generation quiet when it later completes', async () => {
    currentGeneration = createGeneration('PROCESSING');
    await render();
    ReactTestRenderer.act(() => appStateListener?.('active'));
    currentGeneration = createGeneration('COMPLETED');
    await rerender();

    expect(successSpy).not.toHaveBeenCalled();
    expect(refreshGenerationResources).toHaveBeenCalledTimes(1);
  });

  it('shows success once for an active queued/processing to completed transition', async () => {
    currentReport = { ...report, status: 'DRAFT' };
    await render();
    ReactTestRenderer.act(() => appStateListener?.('active'));
    await ReactTestRenderer.act(async () => {
      await presenter?.onStartGeneration();
    });
    currentGeneration = createGeneration('QUEUED');
    await rerender();
    currentReport = report;
    currentGeneration = createGeneration('PROCESSING');
    await rerender();
    currentGeneration = createGeneration('COMPLETED');
    await rerender();
    await rerender();

    expect(successSpy).toHaveBeenCalledTimes(1);
    expect(successSpy).toHaveBeenCalledWith('reports.generation.generated');
    expect(refreshGenerationResources).toHaveBeenCalledTimes(1);
    expect(presenter?.isGenerating).toBe(false);
    expect(appLogger.info).toHaveBeenCalledWith(
      'report.generation_status_changed',
      expect.objectContaining({ generationStatus: 'COMPLETED' }),
    );
  });

  it('stays quiet when completion is observed after the app was backgrounded', async () => {
    currentGeneration = createGeneration('PROCESSING');
    await render();

    ReactTestRenderer.act(() => appStateListener?.('background'));
    currentGeneration = createGeneration('COMPLETED');
    await rerender();

    expect(successSpy).not.toHaveBeenCalled();
    expect(refreshGenerationResources).toHaveBeenCalledTimes(1);
  });

  it('does not re-arm success when a backgrounded generation is first observed complete after resume', async () => {
    currentGeneration = createGeneration('PROCESSING');
    await render();

    ReactTestRenderer.act(() => appStateListener?.('background'));
    ReactTestRenderer.act(() => appStateListener?.('active'));
    currentGeneration = createGeneration('COMPLETED');
    await rerender();

    expect(successSpy).not.toHaveBeenCalled();
    expect(refreshGenerationResources).toHaveBeenCalledTimes(1);
  });

  it('shows one failure toast for an actively observed transition to failed', async () => {
    currentReport = { ...report, status: 'DRAFT' };
    await render();
    ReactTestRenderer.act(() => appStateListener?.('active'));
    await ReactTestRenderer.act(async () => {
      await presenter?.onStartGeneration();
    });
    currentGeneration = createGeneration('QUEUED');
    await rerender();
    currentReport = report;
    currentGeneration = createGeneration('PROCESSING');
    await rerender();
    currentGeneration = createGeneration('FAILED');
    await rerender();
    await rerender();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('reports.generation.startFailed', 'reports.generation.failedDescription');
    expect(refreshGenerationResources).toHaveBeenCalledTimes(1);
    expect(presenter?.isGenerating).toBe(false);
    expect(presenter?.canGenerate).toBe(true);
  });
});
