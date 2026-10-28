import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import {
  createReport,
  deleteReport,
  duplicateReport,
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
  ReportStatus,
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
  const existingReports = data.pages.flatMap((page) => page.data);
  const alreadyContainsReport = existingReports.some((item) => item.id === report.id);
  const nextReports = [report, ...existingReports.filter((item) => item.id !== report.id)];
  const nextTotal = firstPage.total + (alreadyContainsReport ? 0 : 1);
  let pageOffset = 0;

  return {
    ...data,
    pages: data.pages.map((page) => {
      const pageData = nextReports.slice(pageOffset, pageOffset + page.limit);

      pageOffset += page.limit;

      return {
        ...page,
        data: pageData,
        total: nextTotal,
        totalPages: Math.ceil(nextTotal / page.limit),
      };
    }),
  };
};

const removeReportFromList = (
  data: InfiniteData<IPaginatedReports> | undefined,
  reportId: string,
): InfiniteData<IPaginatedReports> | undefined => {
  if (!data || data.pages.length === 0) {
    return data;
  }

  const containsReport = data.pages.some((page) => page.data.some((report) => report.id === reportId));

  if (!containsReport) {
    return data;
  }

  const nextTotal = Math.max(0, data.pages[0].total - 1);
  const nextReports = data.pages.flatMap((page) => page.data).filter((report) => report.id !== reportId);
  let pageOffset = 0;

  return {
    ...data,
    pages: data.pages.map((page) => {
      const pageData = nextReports.slice(pageOffset, pageOffset + page.limit);

      pageOffset += page.limit;

      return {
        ...page,
        data: pageData,
        total: nextTotal,
        totalPages: Math.ceil(nextTotal / page.limit),
      };
    }),
  };
};

const setReportAcrossLists = (
  updater: (data: InfiniteData<IPaginatedReports> | undefined) => InfiniteData<IPaginatedReports> | undefined,
): void => {
  queryClient.setQueriesData<InfiniteData<IPaginatedReports>>({ queryKey: reportsQueryKeys.lists() }, updater);
};

export const setReportStatusInLists = (reportId: string, status: ReportStatus): void => {
  setReportAcrossLists((data) => {
    if (!data) {
      return data;
    }

    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: page.data.map((report) => (report.id === reportId ? { ...report, status } : report)),
      })),
    };
  });
};

export const useReportsListQuery = () => {
  return useInfiniteQuery<
    IPaginatedReports,
    ReportRequestError,
    InfiniteData<IPaginatedReports>,
    ReturnType<typeof reportsQueryKeys.list>,
    number
  >({
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
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
    onSuccess: (response) => {
      if (response.isError || !response.data) {
        return;
      }

      queryClient.setQueryData(reportsQueryKeys.detail(response.data.id), response.data);
      setReportAcrossLists((data) => prependReportToList(data, response.data as IReport));
      queryClient
        .invalidateQueries({
          queryKey: reportsQueryKeys.lists(),
          refetchType: 'none',
        })
        .catch(() => undefined);
    },
  });
};

export const useUpdateReportMutation = (reportId: string) => {
  return useMutation({
    mutationFn: (request: IUpdateReportRequest) => updateReport(reportId, request),
    onSuccess: (response) => {
      if (response.isError || !response.data) {
        return;
      }

      queryClient.setQueryData(reportsQueryKeys.detail(reportId), response.data);
      setReportAcrossLists((data) => updateReportInList(data, response.data as IReport));
      queryClient
        .invalidateQueries({
          queryKey: reportsQueryKeys.detail(reportId),
          refetchType: 'none',
        })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({
          queryKey: reportsQueryKeys.lists(),
          refetchType: 'none',
        })
        .catch(() => undefined);
    },
  });
};

export const useDeleteReportMutation = (reportId: string) => {
  return useMutation({
    mutationFn: () => deleteReport(reportId),
    onSuccess: (response) => {
      if (response.isError && response.status !== 404) {
        return;
      }

      setReportAcrossLists((data) => removeReportFromList(data, reportId));
      queryClient
        .invalidateQueries({
          queryKey: reportsQueryKeys.lists(),
          refetchType: 'none',
        })
        .catch(() => undefined);
    },
  });
};

export const useDuplicateReportMutation = (reportId: string) => {
  return useMutation({
    mutationFn: () => duplicateReport(reportId),
    onSuccess: (response) => {
      if (response.isError || !response.data) {
        return;
      }

      queryClient.setQueryData(reportsQueryKeys.detail(response.data.id), response.data);
      setReportAcrossLists((data) => prependReportToList(data, response.data as IReport));
      queryClient
        .invalidateQueries({
          queryKey: reportsQueryKeys.lists(),
        })
        .catch(() => undefined);
    },
  });
};

export const refreshReportsFirstPage = async (): Promise<IResponse<IPaginatedReports>> => {
  const response = await getReports({
    limit: REPORTS_PAGE_LIMIT,
    page: 1,
  });

  if (!response.isError && response.data) {
    queryClient.setQueryData<InfiniteData<IPaginatedReports>>(reportsQueryKeys.list(REPORTS_PAGE_LIMIT), {
      pageParams: [1],
      pages: [response.data],
    });
  }

  return response;
};

export const removeReportDetailsCache = (reportId: string): void => {
  queryClient.removeQueries({
    exact: true,
    queryKey: reportsQueryKeys.detail(reportId),
  });
};
