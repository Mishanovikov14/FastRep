export type ReportGenerationStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface IReportGeneration {
  completedAt?: string | null;
  createdAt: string;
  errorCode?: string | null;
  id: string;
  progress: number;
  reportId: string;
  stage?: string | null;
  status: ReportGenerationStatus;
  updatedAt: string;
}

export interface IEntitlements {
  canGenerate: boolean;
  generationCredits: {
    available: number;
    monthly: number;
    purchased: number;
  };
  subscription: {
    currentPeriodEnd: string;
    planCode: string;
    status: string;
  } | null;
}

export interface IReportOutput {
  createdAt: string;
  generationId: string;
  id: string;
  mimeType: 'application/pdf';
  size: number;
  type: 'PDF';
}

export interface IReportOutputDownloadUrl {
  expiresAt: string;
  url: string;
}
