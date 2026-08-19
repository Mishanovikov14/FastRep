export type ReportStatus = 'DRAFT' | 'FAILED' | 'PROCESSING' | 'QUEUED' | 'READY';

export interface IReport {
  createdAt: string;
  id: string;
  notes?: string;
  status: ReportStatus;
  title: string;
  updatedAt: string;
}

export interface IPaginatedReports {
  data: IReport[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface ICreateReportRequest {
  notes?: string;
  title: string;
}

export interface IUpdateReportRequest {
  notes?: string;
  title?: string;
}

export interface IReportsListRequest {
  limit: number;
  page: number;
}
