export type ReportAssetType = 'IMAGE' | 'AUDIO' | 'DOCUMENT';
export type ReportAssetStatus = 'PENDING_UPLOAD' | 'READY' | 'REJECTED';
export type LocalReportAssetStatus =
  | 'LOCAL'
  | 'REQUESTING_UPLOAD'
  | 'UPLOADING'
  | 'CONFIRMING'
  | 'READY'
  | 'FAILED';

export interface IReportAsset {
  createdAt: string;
  declaredMimeType: string;
  declaredSize: number;
  durationSeconds?: number | null;
  height?: number | null;
  id: string;
  originalFileName: string;
  position: number;
  reportId: string;
  status: ReportAssetStatus;
  type: ReportAssetType;
  updatedAt: string;
  verifiedMimeType?: string | null;
  verifiedSize?: number | null;
  width?: number | null;
}

export interface IRequestReportAssetUpload {
  fileName: string;
  mimeType: string;
  size: number;
  type: ReportAssetType;
}

export interface IPresignedPostContract {
  fields: Record<string, string>;
  method: 'POST';
  url: string;
}

export interface IReportAssetUploadRequest {
  assetId: string;
  expiresAt: string;
  upload: IPresignedPostContract;
}

export interface ILocalReportAsset {
  assetId?: string;
  durationSeconds?: number;
  errorCode?: ReportAssetValidationErrorCode | 'uploadFailed' | 'confirmFailed';
  fileName: string;
  height?: number;
  id: string;
  mimeType: string;
  progress: number;
  size: number;
  status: LocalReportAssetStatus;
  type: ReportAssetType;
  uploadRequest?: IReportAssetUploadRequest;
  uri: string;
  width?: number;
}

export type ReportAssetValidationErrorCode =
  | 'unsupportedType'
  | 'fileTooLarge'
  | 'imageDimensionsTooLarge'
  | 'audioDurationTooLong'
  | 'tooManyFiles'
  | 'reportTotalTooLarge'
  | 'missingFileMetadata';

export interface IReportAssetCandidate {
  durationSeconds?: number;
  fileName: string;
  height?: number;
  mimeType: string;
  size: number;
  type: ReportAssetType;
  uri: string;
  width?: number;
}
