import type {
  ICreateReportRequest,
  IPaginatedReports,
  IReport,
  IReportsListRequest,
  IUpdateReportRequest,
} from '@/entities/report/types/report';
import type { IResponse } from '@/libs/requester/IResponse';
import { requester } from '@/libs/requester/requester';

export const createReport = (request: ICreateReportRequest): Promise<IResponse<IReport>> => {
  return requester.request<IReport>({
    data: request,
    method: 'POST',
    url: '/reports',
  });
};

export const getReports = ({ limit, page }: IReportsListRequest): Promise<IResponse<IPaginatedReports>> => {
  return requester.request<IPaginatedReports>({
    method: 'GET',
    params: {
      limit,
      page,
    },
    url: '/reports',
  });
};

export const getReportById = (id: string): Promise<IResponse<IReport>> => {
  return requester.request<IReport>({
    method: 'GET',
    url: `/reports/${id}`,
  });
};

export const updateReport = (id: string, request: IUpdateReportRequest): Promise<IResponse<IReport>> => {
  const data: IUpdateReportRequest = {
    ...(request.notes !== undefined ? { notes: request.notes } : {}),
    ...(request.title !== undefined ? { title: request.title } : {}),
  };

  return requester.request<IReport>({
    data,
    method: 'PATCH',
    url: `/reports/${id}`,
  });
};

export const deleteReport = (id: string): Promise<IResponse<void>> => {
  return requester.request<void>({
    method: 'DELETE',
    url: `/reports/${id}`,
  });
};

export const duplicateReport = (id: string): Promise<IResponse<IReport>> => {
  return requester.request<IReport>({
    method: 'POST',
    url: `/reports/${id}/duplicate`,
  });
};
