import { useNavigation } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import type { IReport } from '@/entities/report/types/report';
import { refreshReportsFirstPage, useReportsListQuery } from '@/modules/reports/presenters/reportQueries';
import { useReportsListViewPresenter } from '@/modules/reports/ui/ReportsListView/presenters/useReportsListViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));
jest.mock('@/modules/reports/presenters/reportQueries', () => ({
  refreshReportsFirstPage: jest.fn(),
  useReportsListQuery: jest.fn(),
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: {
    showError: jest.fn(),
  },
}));

const t = ((key: string) => key) as unknown as TFunction;
const report: IReport = {
  createdAt: '2026-07-27T10:00:00.000Z',
  id: 'report-1',
  notes: 'Notes',
  status: 'DRAFT',
  title: 'Report',
  updatedAt: '2026-07-27T10:00:00.000Z',
};

describe('useReportsListViewPresenter', () => {
  const navigation = {
    navigate: jest.fn(),
  };
  const fetchNextPage = jest.fn();
  const refetch = jest.fn();
  let presenter: ReturnType<typeof useReportsListViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useReportsListViewPresenter({ t });

    return null;
  };

  const mockQuery = (overrides: Record<string, unknown> = {}) => {
    jest.mocked(useReportsListQuery).mockReturnValue({
      data: undefined,
      error: null,
      fetchNextPage,
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isPending: false,
      isRefetching: false,
      refetch,
      ...overrides,
    } as never);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    presenter = undefined;
    jest.mocked(useNavigation).mockReturnValue(navigation as never);
    jest.mocked(refreshReportsFirstPage).mockResolvedValue({
      data: {
        data: [report],
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
      },
      isError: false,
      message: '',
    });
    mockQuery();
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  });

  it('exposes the initial loading and empty states', async () => {
    mockQuery({ isPending: true });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(presenter?.isLoading).toBe(true);
    expect(presenter?.isEmpty).toBe(false);

    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    mockQuery();

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(presenter?.isEmpty).toBe(true);
  });

  it('flattens successful pages and opens details or create', async () => {
    mockQuery({
      data: {
        pageParams: [1],
        pages: [{ data: [report], limit: 20, page: 1, total: 1, totalPages: 1 }],
      },
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    expect(presenter?.reports).toEqual([report]);

    ReactTestRenderer.act(() => {
      presenter?.onOpenReport(report);
      presenter?.onCreateReport();
    });

    expect(navigation.navigate).toHaveBeenNthCalledWith(1, 'ReportDetails', {
      reportId: 'report-1',
    });
    expect(navigation.navigate).toHaveBeenNthCalledWith(2, 'CreateReport');
  });

  it('loads only one next page and supports retry', async () => {
    let resolveNextPage: (() => void) | undefined;
    fetchNextPage.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveNextPage = resolve;
      }),
    );
    mockQuery({ hasNextPage: true });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    let firstLoad: Promise<void> | undefined;

    ReactTestRenderer.act(() => {
      firstLoad = presenter?.onLoadMore();
      presenter?.onLoadMore();
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    resolveNextPage?.();

    await ReactTestRenderer.act(async () => {
      await firstLoad;
      await presenter?.onRetry();
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps cached data while refreshing only the first page', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onRefresh();
    });

    expect(refreshReportsFirstPage).toHaveBeenCalledTimes(1);
  });
});
