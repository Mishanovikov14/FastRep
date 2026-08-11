export type ReportAssetRejectionKey =
  | 'expired'
  | 'invalidContent'
  | 'limitExceeded'
  | 'processingFailed'
  | 'storageUnavailable'
  | 'tooLarge'
  | 'unsupportedType';

const keysByReason: Record<string, ReportAssetRejectionKey> = {
  ASSET_TOO_LARGE: 'tooLarge',
  INVALID_IMAGE_DIMENSIONS: 'invalidContent',
  OBJECT_STORAGE_UNAVAILABLE: 'storageUnavailable',
  REPORT_ASSET_LIMIT_EXCEEDED: 'limitExceeded',
  REPORT_STORAGE_LIMIT_EXCEEDED: 'limitExceeded',
  UNSUPPORTED_ASSET_TYPE: 'unsupportedType',
  UPLOAD_CONTENT_MISMATCH: 'invalidContent',
  UPLOAD_EXPIRED: 'expired',
  UPLOAD_NOT_FOUND: 'expired',
};

export const getReportAssetRejectionKey = (reason?: string | null): ReportAssetRejectionKey => {
  return (reason && keysByReason[reason]) || 'processingFailed';
};
