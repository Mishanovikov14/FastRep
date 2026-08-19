import type {
  ReportAssetType,
  ReportAttachmentErrorCode,
  ReportAttachmentStage,
} from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';
import type { ISafeLogMetadata } from '@/libs/logger/types';

const failureEventByType: Record<ReportAssetType, string> = {
  AUDIO: 'report.audio_add_failed',
  DOCUMENT: 'report.document_add_failed',
  IMAGE: 'report.photo_add_failed',
};

type AttachmentMetadata = Omit<ISafeLogMetadata, 'assetType' | 'errorCode' | 'stage'>;

export const getUriScheme = (uri: string): string => {
  return uri.match(/^([a-z][a-z0-9+.-]*):/iu)?.[1]?.toLowerCase() ?? 'path';
};

export const logAttachmentStage = (
  assetType: ReportAssetType,
  stage: ReportAttachmentStage,
  metadata?: AttachmentMetadata,
): void => {
  logger.debug('report.attachment_stage', { ...metadata, assetType, stage });
};

export const logAttachmentFailure = (
  assetType: ReportAssetType,
  stage: ReportAttachmentStage,
  errorCode: ReportAttachmentErrorCode,
  metadata?: AttachmentMetadata,
): void => {
  logger.error(failureEventByType[assetType], { ...metadata, assetType, errorCode, stage });
};
