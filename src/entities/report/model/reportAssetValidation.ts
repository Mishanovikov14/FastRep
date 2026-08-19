import { reportAssetLimits, supportedAssetMimeTypes } from '@/entities/report/config/reportAssetLimits';
import type {
  IReportAsset,
  IReportAssetCandidate,
  ReportAssetType,
  ReportAssetValidationErrorCode,
} from '@/entities/report/types/reportAsset';

const maxBytesByType: Record<ReportAssetType, number> = {
  AUDIO: reportAssetLimits.audioMaxBytes,
  DOCUMENT: reportAssetLimits.documentMaxBytes,
  IMAGE: reportAssetLimits.imageMaxBytes,
};

const maxCountByType: Record<ReportAssetType, number> = {
  AUDIO: reportAssetLimits.reportMaxAudioFiles,
  DOCUMENT: reportAssetLimits.reportMaxDocuments,
  IMAGE: reportAssetLimits.reportMaxImages,
};

export const sanitizeAssetFileName = (fileName: string, fallbackExtension: string): string => {
  const normalized = fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._ -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 255);

  return normalized || `attachment-${Date.now()}.${fallbackExtension}`;
};

export const isSupportedAssetMimeType = (type: ReportAssetType, mimeType: string): boolean => {
  return (supportedAssetMimeTypes[type] as readonly string[]).includes(mimeType.toLowerCase());
};

export const validateReportAssetCandidate = (
  candidate: IReportAssetCandidate,
  existingAssets: Array<Pick<IReportAsset, 'declaredSize' | 'type'>>,
  pendingAssets: IReportAssetCandidate[] = [],
): ReportAssetValidationErrorCode | undefined => {
  if (!candidate.uri || !candidate.fileName || candidate.size <= 0 || !candidate.mimeType) {
    return 'missingFileMetadata';
  }

  if (!isSupportedAssetMimeType(candidate.type, candidate.mimeType)) {
    return 'unsupportedType';
  }

  if (candidate.size > maxBytesByType[candidate.type]) {
    return 'fileTooLarge';
  }

  if (
    candidate.type === 'IMAGE' &&
    ((candidate.width ?? 0) > reportAssetLimits.imageMaxWidth ||
      (candidate.height ?? 0) > reportAssetLimits.imageMaxHeight)
  ) {
    return 'imageDimensionsTooLarge';
  }

  if (candidate.type === 'AUDIO' && (candidate.durationSeconds ?? 0) > reportAssetLimits.audioMaxDurationSeconds) {
    return 'audioDurationTooLong';
  }

  const typeCount = [...existingAssets, ...pendingAssets].filter((asset) => asset.type === candidate.type).length;

  if (typeCount >= maxCountByType[candidate.type]) {
    return 'tooManyFiles';
  }

  const totalBytes = [...existingAssets, ...pendingAssets].reduce(
    (total, asset) => total + ('size' in asset ? asset.size : asset.declaredSize),
    candidate.size,
  );

  if (totalBytes > reportAssetLimits.reportMaxTotalAssetBytes) {
    return 'reportTotalTooLarge';
  }

  return undefined;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    const kilobytes = bytes / 1024;
    return `${Number.isInteger(kilobytes) ? kilobytes : kilobytes.toFixed(1)} KB`;
  }

  const megabytes = bytes / (1024 * 1024);
  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
};

export const formatAudioDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};
