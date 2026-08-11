import { useMutation, useQuery } from '@tanstack/react-query';

import {
  cancelReportGeneration,
  getEntitlements,
  getLatestReportGeneration,
  getReportGeneration,
  getReportOutput,
  startReportGeneration,
} from '@/entities/report/API/reportGenerationsApi';
import { entitlementsQueryKeys, reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';
import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import type { IReportGeneration } from '@/entities/report/types/reportGeneration';
import { queryClient } from '@/libs/query/QueryClient';
import type { IResponse } from '@/libs/requester/IResponse';

const unwrap = <T>(response: IResponse<T>): T => {
  if (response.isError || response.data === undefined) {
    throw new ReportRequestError(response);
  }

  return response.data;
};

const isActiveGeneration = (generation?: IReportGeneration | null): boolean => {
  return generation?.status === 'QUEUED' || generation?.status === 'PROCESSING';
};

export const useEntitlementsQuery = () => {
  return useQuery({
    queryFn: async () => unwrap(await getEntitlements()),
    queryKey: entitlementsQueryKeys.all,
    staleTime: 30_000,
  });
};

export const useLatestReportGenerationQuery = (reportId: string) => {
  return useQuery({
    queryFn: async () => {
      const response = await getLatestReportGeneration(reportId);

      if (response.status === 404) {
        return null;
      }

      return unwrap(response);
    },
    queryKey: reportsQueryKeys.generationLatest(reportId),
    refetchInterval: (query) => (isActiveGeneration(query.state.data) ? 2_000 : false),
    staleTime: 0,
  });
};

export const useReportGenerationQuery = (reportId: string, generationId?: string) => {
  return useQuery({
    enabled: Boolean(generationId),
    queryFn: async () => unwrap(await getReportGeneration(reportId, generationId as string)),
    queryKey: reportsQueryKeys.generation(reportId, generationId ?? 'none'),
    refetchInterval: (query) => (isActiveGeneration(query.state.data) ? 2_000 : false),
    staleTime: 0,
  });
};

export const useStartReportGenerationMutation = (reportId: string) => {
  return useMutation({
    mutationFn: (idempotencyKey: string) => startReportGeneration(reportId, idempotencyKey),
    onSuccess: (response) => {
      if (!response.isError && response.data) {
        queryClient.setQueryData(reportsQueryKeys.generationLatest(reportId), response.data);
        queryClient.setQueryData(reportsQueryKeys.generation(reportId, response.data.id), response.data);
      }
    },
  });
};

export const useCancelReportGenerationMutation = (reportId: string) => {
  return useMutation({
    mutationFn: (generationId: string) => cancelReportGeneration(reportId, generationId),
  });
};

export const useReportOutputQuery = (reportId: string, enabled: boolean) => {
  return useQuery({
    enabled,
    queryFn: async () => {
      const response = await getReportOutput(reportId);

      if (response.status === 404) {
        return null;
      }

      return unwrap(response);
    },
    queryKey: reportsQueryKeys.output(reportId),
  });
};

export const refreshGenerationResources = async (reportId: string): Promise<void> => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: reportsQueryKeys.detail(reportId) }),
    queryClient.invalidateQueries({ queryKey: reportsQueryKeys.output(reportId) }),
    queryClient.invalidateQueries({ queryKey: entitlementsQueryKeys.all }),
  ]);
};
