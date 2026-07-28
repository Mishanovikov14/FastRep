import {
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import {
  createReport,
  deleteReport,
  getReportById,
  getReports,
  updateReport,
} from '@/entities/report/API/reportsApi';
import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import { reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';
import type {
  ICreateReportRequest,
  IPaginatedReports,
  IReport,
  IUpdateReportRequest,
} from '@/entities/report/types/report';
import { queryClient } from '@/libs/query/QueryClient';
import type { IResponse } from '@/libs/requester/IResponse';

export const REPORTS_PAGE_LIMIT = 20;

const unwrapResponse = <T>(response: IResponse<T>): T => {
  if (response.isError || response.data === undefined) {
    throw new ReportRequestError(
      response.isError
        ? response
        : {
            isError: true,
            message: 'The server returned an empty response.',
            type: 'empty_response',
          },
    );
  }

  return response.data;
};

const shouldRetryReportQuery = (failureCount: number, error: Error): boolean => {
  if (
    error instanceof ReportRequestError &&
    error.status !== undefined &&
    [400, 401, 404, 422].includes(error.status)
  ) {
    return false;
  }

  return failureCount < 2;
};

const updateReportInList = (
  data: InfiniteData<IPaginatedReports> | undefined,
  report: IReport,
): InfiniteData<IPaginatedReports> | undefined => {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((item) => (item.id === report.id ? report : item)),
    })),
  };
};

const prependReportToList = (
  data: InfiniteData<IPaginatedReports> | undefined,
  report: IReport,
): InfiniteData<IPaginatedReports> | undefined => {
  if (!data || data.pages.length === 0) {
    return data;
  }

  const firstPage = data.pages[0];
  const nextTotal = firstPage.total + 1;

  return {
    ...data,
    pages: data.pages.map((page, index) => ({
      ...page,
      data:
        index === 0
          ? [report, ...page.data.filter((item) => item.id !== report.id)].slice(0, page.limit)
          : page.data.filter((item) => item.id !== report.id),
      total: nextTotal,
      totalPages: Math.ceil(nextTotal / page.limit),
    })),
  };
};

const removeReportFromList = (
  data: InfiniteData<IPaginatedReports> | undefined,
  reportId: string,
): InfiniteData<IPaginatedReports> | undefined => {
  if (!data || data.pages.length === 0) {
    return data;
  }

  const containsReport = data.pages.some((page) =>
    page.data.some((report) => report.id === reportId),
  );

  if (!containsReport) {
    return data;
  }

  const nextTotal = Math.max(0, data.pages[0].total - 1);

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.filter((report) => report.id !== reportId),
      total: nextTotal,
      totalPages: Math.ceil(nextTotal / page.limit),
    })),
  };
};

const setReportAcrossLists = (
  updater: (
    data: InfiniteData<IPaginatedReports> | undefined,
  ) => InfiniteData<IPaginatedReports> | undefined,
): void => {
  queryClient.setQueriesData<InfiniteData<IPaginatedReports>>(
    { queryKey: reportsQueryKeys.lists() },
    updater,
  );
};

export const useReportsListQuery = () => {
  return useInfiniteQuery<
    IPaginatedReports,
    ReportRequestError,
    InfiniteData<IPaginatedReports>,
    ReturnType<typeof reportsQueryKeys.list>,
    number
  >({
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await getReports({
        limit: REPORTS_PAGE_LIMIT,
        page: pageParam,
      });

      return unwrapResponse(response);
    },
    queryKey: reportsQueryKeys.list(REPORTS_PAGE_LIMIT),
    retry: shouldRetryReportQuery,
  });
};

export const useReportDetailsQuery = (reportId: string) => {
  return useQuery({
    queryFn: async () => {
      const response = await getReportById(reportId);

      return unwrapResponse(response);
    },
    queryKey: reportsQueryKeys.detail(reportId),
    retry: shouldRetryReportQuery,
  });
};

export const useCreateReportMutation = () => {
  return useMutation({
    mutationFn: (request: ICreateReportRequest) => createReport(request),
    onSuccess: async (response) => {
      if (response.isError || !response.data) {
        return;
      }

      queryClient.setQueryData(reportsQueryKeys.detail(response.data.id), response.data);
      setReportAcrossLists((data) => prependReportToList(data, response.data as IReport));
      await queryClient.invalidateQueries({ queryKey: reportsQueryKeys.lists() });
    },
  });
};

export const useUpdateReportMutation = (reportId: string) => {
  return useMutation({
    mutationFn: (request: IUpdateReportRequest) => updateReport(reportId, request),
    onSuccess: async (response) => {
      if (response.isError || !response.data) {
        return;
      }

      queryClient.setQueryData(reportsQueryKeys.detail(reportId), response.data);
      setReportAcrossLists((data) => updateReportInList(data, response.data as IReport));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reportsQueryKeys.detail(reportId) }),
        queryClient.invalidateQueries({ queryKey: reportsQueryKeys.lists() }),
      ]);
    },
  });
};

export const useDeleteReportMutation = (reportId: string) => {
  return useMutation({
    mutationFn: () => deleteReport(reportId),
    onSuccess: async (response) => {
      if (response.isError && response.status !== 404) {
        return;
      }

      queryClient.removeQueries({ queryKey: reportsQueryKeys.detail(reportId) });
      setReportAcrossLists((data) => removeReportFromList(data, reportId));
      await queryClient.invalidateQueries({ queryKey: reportsQueryKeys.lists() });
    },
  });
};
