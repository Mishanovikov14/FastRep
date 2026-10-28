import { useNavigation } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import type { IReport } from '@/entities/report/types/report';
import { toastService } from '@/libs/toast/toastService';
import {
  removeReportDetailsCache,
  useCreateReportMutation,
  useDeleteReportMutation,
  useReportDetailsQuery,
  useDuplicateReportMutation,
  useUpdateReportMutation,
} from '@/modules/reports/presenters/reportQueries';
import { useLatestReportGenerationQuery } from '@/modules/reports/presenters/reportGenerationQueries';
import { useCreateReportViewPresenter } from '@/modules/reports/ui/CreateReportView/presenters/useCreateReportViewPresenter';
import { useEditReportViewPresenter } from '@/modules/reports/ui/EditReportView/presenters/useEditReportViewPresenter';
import { useReportDetailsViewPresenter } from '@/modules/reports/ui/ReportDetailsView/presenters/useReportDetailsViewPresenter';
import { useReportAttachmentsPresenter } from '@/modules/reports/ui/ReportDetailsView/presenters/useReportAttachmentsPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));
jest.mock('@/modules/reports/presenters/reportQueries', () => ({
  removeReportDetailsCache: jest.fn(),
  useCreateReportMutation: jest.fn(),
  useDeleteReportMutation: jest.fn(),
  useReportDetailsQuery: jest.fn(),
  useDuplicateReportMutation: jest.fn(),
  useUpdateReportMutation: jest.fn(),
}));
jest.mock('@/modules/reports/presenters/reportGenerationQueries', () => ({
  useLatestReportGenerationQuery: jest.fn(),
}));
jest.mock('@/modules/reports/ui/ReportDetailsView/presenters/useReportAttachmentsPresenter', () => ({
  useReportAttachmentsPresenter: jest.fn(() => ({
    assets: [],
    canEdit: false,
    hasReadyAssets: false,
    hasUnresolvedAssets: false,
    isLoadingAssets: false,
    isRecording: false,
    localAssets: [],
    recordingDuration: 0,
  })),
}));
jest.mock('@/modules/reports/ui/ReportDetailsView/presenters/useReportGenerationPresenter', () => ({
  useReportGenerationPresenter: jest.fn(() => ({})),
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  },
}));
jest.mock('@/utils/formatLocalizedDate', () => ({
  formatLocalizedDate: jest.fn(() => '27 Jul 2026, 10:00'),
}));

const t = ((key: string) => key) as unknown as TFunction;
const report: IReport = {
  createdAt: '2026-07-27T10:00:00.000Z',
  id: 'report-1',
  notes: 'Existing notes',
  status: 'READY',
  title: 'Existing title',
  updatedAt: '2026-07-27T11:00:00.000Z',
};

describe('report mutation presenters', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    popTo: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };
  const createMutate = jest.fn();
  const updateMutate = jest.fn();
  const deleteMutate = jest.fn();
  const duplicateMutate = jest.fn();
  const refetch = jest.fn();
  const refetchLatestGeneration = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useNavigation).mockReturnValue(navigation as never);
    jest.mocked(useCreateReportMutation).mockReturnValue({
      isPending: false,
      mutateAsync: createMutate,
    } as never);
    jest.mocked(useUpdateReportMutation).mockReturnValue({
      isPending: false,
      mutateAsync: updateMutate,
    } as never);
    jest.mocked(useDeleteReportMutation).mockReturnValue({
      isPending: false,
      mutateAsync: deleteMutate,
    } as never);
    jest.mocked(useDuplicateReportMutation).mockReturnValue({
      isPending: false,
      mutateAsync: duplicateMutate,
    } as never);
    jest.mocked(useReportDetailsQuery).mockReturnValue({
      data: report,
      error: null,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch,
    } as never);
    jest.mocked(useLatestReportGenerationQuery).mockReturnValue({
      data: null,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: refetchLatestGeneration,
    } as never);
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  });

  it('creates once, trims values, and replaces the form with details', async () => {
    let presenter: ReturnType<typeof useCreateReportViewPresenter> | undefined;
    let resolveCreate: ((value: { data: IReport; isError: false; message: string }) => void) | undefined;
    createMutate.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const Harness = () => {
      presenter = useCreateReportViewPresenter({ t });

      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
    ReactTestRenderer.act(() => {
      presenter?.onChangeTitle('  New report  ');
      presenter?.onChangeNotes('  New notes  ');
    });

    let firstSubmit: Promise<void> | undefined;

    ReactTestRenderer.act(() => {
      firstSubmit = presenter?.onSubmit();
      presenter?.onSubmit();
    });

    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate).toHaveBeenCalledWith({
      notes: 'New notes',
      title: 'New report',
    });

    resolveCreate?.({
      data: { ...report, title: 'New report' },
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await firstSubmit;
    });

    expect(navigation.replace).toHaveBeenCalledWith('ReportDetails', {
      reportId: 'report-1',
    });
    expect(toastService.showSuccess).toHaveBeenCalledWith('reports.create.success');
  });

  it('prefills and updates only title and notes before navigating back', async () => {
    let presenter: ReturnType<typeof useEditReportViewPresenter> | undefined;
    updateMutate.mockResolvedValue({
      data: { ...report, status: 'DRAFT', title: 'Updated title' },
      isError: false,
      message: '',
    });
    jest.mocked(useReportDetailsQuery).mockReturnValue({
      data: { ...report, status: 'DRAFT' },
      error: null,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch,
    } as never);

    const Harness = () => {
      presenter = useEditReportViewPresenter({ reportId: report.id, t });

      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(presenter?.title).toBe('Existing title');
    expect(presenter?.notes).toBe('Existing notes');

    ReactTestRenderer.act(() => {
      presenter?.onChangeTitle('  Updated title  ');
      presenter?.onChangeNotes('  Updated notes  ');
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onSubmit();
    });

    expect(updateMutate).toHaveBeenCalledWith({
      notes: 'Updated notes',
      title: 'Updated title',
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(toastService.showSuccess).toHaveBeenCalledWith('reports.edit.success');
  });

  it('deletes successfully and returns to the reports list', async () => {
    let presenter: ReturnType<typeof useReportDetailsViewPresenter> | undefined;
    deleteMutate.mockResolvedValue({
      isError: false,
      message: '',
    });

    const Harness = () => {
      presenter = useReportDetailsViewPresenter({
        language: 'en',
        reportId: report.id,
        t,
      });

      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
    ReactTestRenderer.act(() => {
      presenter?.onShowDeleteConfirmation();
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onDelete();
    });

    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(navigation.popTo).toHaveBeenCalledWith('Tabs', {
      screen: 'Reports',
    });
    expect(removeReportDetailsCache).toHaveBeenCalledWith('report-1');
    expect(toastService.showSuccess).toHaveBeenCalledWith('reports.delete.success');
    expect(presenter?.deleteActions.find((action) => action.key === 'delete')?.variant).toBe('danger');
  });

  it('does not expose background query refetching as manual refreshing', async () => {
    let presenter: ReturnType<typeof useReportDetailsViewPresenter> | undefined;
    jest.mocked(useReportDetailsQuery).mockReturnValue({
      data: report,
      error: null,
      isError: false,
      isPending: false,
      isRefetching: true,
      refetch,
    } as never);
    jest.mocked(useLatestReportGenerationQuery).mockReturnValue({
      data: {
        createdAt: '2026-08-19T10:00:00.000Z',
        id: 'generation-processing',
        progress: 60,
        reportId: report.id,
        status: 'PROCESSING',
        updatedAt: '2026-08-19T10:00:00.000Z',
      },
      isError: false,
      isPending: false,
      isRefetching: true,
      refetch: refetchLatestGeneration,
    } as never);

    const Harness = () => {
      presenter = useReportDetailsViewPresenter({ language: 'en', reportId: report.id, t });
      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(presenter?.isRefreshing).toBe(false);
  });

  it('shows manual refreshing only while both explicit refetches are pending', async () => {
    let presenter: ReturnType<typeof useReportDetailsViewPresenter> | undefined;
    let resolveReport: (() => void) | undefined;
    let resolveGeneration: (() => void) | undefined;
    refetch.mockReturnValue(
      new Promise((resolve) => {
        resolveReport = () => resolve({});
      }),
    );
    refetchLatestGeneration.mockReturnValue(
      new Promise((resolve) => {
        resolveGeneration = () => resolve({});
      }),
    );

    const Harness = () => {
      presenter = useReportDetailsViewPresenter({ language: 'en', reportId: report.id, t });
      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    let refresh: Promise<void> | undefined;
    ReactTestRenderer.act(() => {
      refresh = presenter?.onRefresh();
    });

    expect(presenter?.isRefreshing).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetchLatestGeneration).toHaveBeenCalledTimes(1);

    resolveReport?.();
    resolveGeneration?.();
    await ReactTestRenderer.act(async () => {
      await refresh;
    });

    expect(presenter?.isRefreshing).toBe(false);
  });

  it('blocks edit outside editable states, retries details, and exposes a 404 not-found state', async () => {
    let presenter: ReturnType<typeof useReportDetailsViewPresenter> | undefined;
    jest.mocked(useReportDetailsQuery).mockReturnValue({
      data: undefined,
      error: new ReportRequestError({
        isError: true,
        message: 'Not found',
        status: 404,
      }),
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    } as never);

    const Harness = () => {
      presenter = useReportDetailsViewPresenter({
        language: 'en',
        reportId: report.id,
        t,
      });

      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(presenter?.isNotFound).toBe(true);

    await ReactTestRenderer.act(async () => {
      presenter?.onEdit();
      await presenter?.onRetry();
    });

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('duplicates a ready report and opens the new draft details', async () => {
    let presenter: ReturnType<typeof useReportDetailsViewPresenter> | undefined;
    duplicateMutate.mockResolvedValue({
      data: { ...report, id: 'report-copy', status: 'DRAFT', title: 'Existing title — Copy' },
      isError: false,
      message: '',
    });

    const Harness = () => {
      presenter = useReportDetailsViewPresenter({ language: 'en', reportId: report.id, t });
      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
    await ReactTestRenderer.act(async () => {
      await presenter?.onDuplicate();
    });

    expect(duplicateMutate).toHaveBeenCalledTimes(1);
    expect(navigation.push).toHaveBeenCalledWith('ReportDetails', { reportId: 'report-copy' });
    expect(toastService.showSuccess).not.toHaveBeenCalled();
  });

  it.each(['QUEUED', 'PROCESSING'] as const)(
    'restores %s as non-editable from the latest generation query on mount',
    async (status) => {
      let presenter: ReturnType<typeof useReportDetailsViewPresenter> | undefined;
      jest.mocked(useReportDetailsQuery).mockReturnValue({
        data: { ...report, status: 'DRAFT' },
        error: null,
        isError: false,
        isPending: false,
        isRefetching: false,
        refetch,
      } as never);
      jest.mocked(useLatestReportGenerationQuery).mockReturnValue({
        data: {
          createdAt: '2026-08-19T10:00:00.000Z',
          id: 'generation-active',
          progress: 25,
          reportId: report.id,
          status,
          updatedAt: '2026-08-19T10:00:00.000Z',
        },
      } as never);

      const Harness = () => {
        presenter = useReportDetailsViewPresenter({ language: 'en', reportId: report.id, t });
        return null;
      };

      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<Harness />);
      });

      expect(presenter?.canEditSources).toBe(false);
      expect(presenter?.reportStatus).toBe(status);
      expect(useReportAttachmentsPresenter).toHaveBeenCalledWith(
        expect.objectContaining({ canEdit: false, reportId: report.id }),
      );
      ReactTestRenderer.act(() => presenter?.onEdit());
      expect(navigation.navigate).not.toHaveBeenCalled();
    },
  );

  it('blocks duplicate, title, and notes mutations while the latest generation is active', async () => {
    let detailsPresenter: ReturnType<typeof useReportDetailsViewPresenter> | undefined;
    let editPresenter: ReturnType<typeof useEditReportViewPresenter> | undefined;
    jest.mocked(useReportDetailsQuery).mockReturnValue({
      data: { ...report, status: 'DRAFT' },
      error: null,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch,
    } as never);
    jest.mocked(useLatestReportGenerationQuery).mockReturnValue({
      data: {
        createdAt: '2026-08-19T10:00:00.000Z',
        id: 'generation-processing',
        progress: 50,
        reportId: report.id,
        status: 'PROCESSING',
        updatedAt: '2026-08-19T10:00:00.000Z',
      },
      refetch,
    } as never);

    const DetailsHarness = () => {
      detailsPresenter = useReportDetailsViewPresenter({ language: 'en', reportId: report.id, t });
      return null;
    };
    const EditHarness = () => {
      editPresenter = useEditReportViewPresenter({ reportId: report.id, t });
      return null;
    };

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<DetailsHarness />);
    });
    await ReactTestRenderer.act(async () => {
      await detailsPresenter?.onDuplicate();
      renderer?.update(<EditHarness />);
    });
    ReactTestRenderer.act(() => {
      editPresenter?.onChangeTitle('Blocked title');
      editPresenter?.onChangeNotes('Blocked notes');
    });
    await ReactTestRenderer.act(async () => editPresenter?.onSubmit());

    expect(duplicateMutate).not.toHaveBeenCalled();
    expect(updateMutate).not.toHaveBeenCalled();
    expect(editPresenter?.isEditable).toBe(false);
    expect(editPresenter?.title).not.toBe('Blocked title');
    expect(editPresenter?.notes).not.toBe('Blocked notes');
  });
});
