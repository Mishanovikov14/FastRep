import type {
  IEntitlements,
  IReportGeneration,
  IReportOutput,
  IReportOutputDownloadUrl,
} from '@/entities/report/types/reportGeneration';
import type { IResponse } from '@/libs/requester/IResponse';
import { requester } from '@/libs/requester/requester';

export const getEntitlements = (): Promise<IResponse<IEntitlements>> => {
  return requester.request<IEntitlements>({ method: 'GET', url: '/me/entitlements' });
};

export const startReportGeneration = (
  reportId: string,
  idempotencyKey: string,
): Promise<IResponse<IReportGeneration>> => {
  return requester.request<IReportGeneration>({
    headers: { 'Idempotency-Key': idempotencyKey },
    method: 'POST',
    url: `/reports/${reportId}/generations`,
  });
};

export const getLatestReportGeneration = (reportId: string): Promise<IResponse<IReportGeneration>> => {
  return requester.request<IReportGeneration>({ method: 'GET', url: `/reports/${reportId}/generations/latest` });
};

export const getReportGeneration = (
  reportId: string,
  generationId: string,
): Promise<IResponse<IReportGeneration>> => {
  return requester.request<IReportGeneration>({
    method: 'GET',
    url: `/reports/${reportId}/generations/${generationId}`,
  });
};

export const cancelReportGeneration = (
  reportId: string,
  generationId: string,
): Promise<IResponse<IReportGeneration>> => {
  return requester.request<IReportGeneration>({
    method: 'POST',
    url: `/reports/${reportId}/generations/${generationId}/cancel`,
  });
};

export const getReportOutput = (reportId: string): Promise<IResponse<IReportOutput>> => {
  return requester.request<IReportOutput>({ method: 'GET', url: `/reports/${reportId}/output` });
};

export const createReportOutputDownloadUrl = (reportId: string): Promise<IResponse<IReportOutputDownloadUrl>> => {
  return requester.request<IReportOutputDownloadUrl>({ method: 'POST', url: `/reports/${reportId}/output/download-url` });
};
