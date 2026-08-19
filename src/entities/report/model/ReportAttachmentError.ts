import type {
  ReportAssetType,
  ReportAttachmentErrorCode,
  ReportAttachmentStage,
} from '@/entities/report/types/reportAsset';

export class ReportAttachmentError extends Error {
  constructor(
    public readonly assetType: ReportAssetType,
    public readonly code: ReportAttachmentErrorCode,
    public readonly stage: ReportAttachmentStage,
  ) {
    super(code);
    this.name = 'ReportAttachmentError';
  }
}
