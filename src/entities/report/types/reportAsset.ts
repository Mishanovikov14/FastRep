export type ReportAssetType = 'IMAGE' | 'AUDIO' | 'DOCUMENT';
export type ReportAssetStatus = 'PENDING_UPLOAD' | 'READY' | 'REJECTED';
export type ReportAssetFileOwnership = 'APP_TEMPORARY' | 'SYSTEM_OWNED';
export type ReportAttachmentStage =
  | 'PICKER_OPENING'
  | 'PICKER_RETURNED'
  | 'METADATA_NORMALIZING'
  | 'FILE_STAT'
  | 'VALIDATING'
  | 'PERMISSION_REQUEST'
  | 'RECORDER_START'
  | 'RECORDING'
  | 'RECORDER_STOP'
  | 'FILE_NORMALIZATION'
  | 'UPLOAD_REQUEST_STARTED'
  | 'UPLOAD_REQUEST_SUCCEEDED'
  | 'STORAGE_UPLOAD_STARTED'
  | 'STORAGE_UPLOAD_SUCCEEDED'
  | 'CONFIRM_STARTED'
  | 'CONFIRM_SUCCEEDED'
  | 'READY';
export type ReportAttachmentErrorCode =
  | 'IMAGE_PICKER_FAILED'
  | 'IMAGE_CAMERA_PERMISSION_DENIED'
  | 'IMAGE_URI_MISSING'
  | 'IMAGE_URI_UNSUPPORTED'
  | 'IMAGE_FILE_UNREADABLE'
  | 'IMAGE_MIME_MISSING'
  | 'IMAGE_UNSUPPORTED_TYPE'
  | 'IMAGE_HEIC_CONVERSION_FAILED'
  | 'IMAGE_VALIDATION_FAILED'
  | 'IMAGE_UPLOAD_REQUEST_FAILED'
  | 'IMAGE_STORAGE_UPLOAD_FAILED'
  | 'IMAGE_CONFIRM_FAILED'
  | 'DOCUMENT_PICKER_FAILED'
  | 'DOCUMENT_URI_MISSING'
  | 'DOCUMENT_COPY_FAILED'
  | 'DOCUMENT_FILE_UNREADABLE'
  | 'DOCUMENT_MIME_MISSING'
  | 'DOCUMENT_UNSUPPORTED_TYPE'
  | 'DOCUMENT_VALIDATION_FAILED'
  | 'DOCUMENT_UPLOAD_REQUEST_FAILED'
  | 'DOCUMENT_STORAGE_UPLOAD_FAILED'
  | 'DOCUMENT_CONFIRM_FAILED'
  | 'AUDIO_PERMISSION_DENIED'
  | 'AUDIO_RECORDER_START_FAILED'
  | 'AUDIO_RECORDER_STOP_FAILED'
  | 'AUDIO_PATH_MISSING'
  | 'AUDIO_FILE_UNREADABLE'
  | 'AUDIO_INVALID_OUTPUT'
  | 'AUDIO_VALIDATION_FAILED'
  | 'AUDIO_UPLOAD_REQUEST_FAILED'
  | 'AUDIO_STORAGE_UPLOAD_FAILED'
  | 'AUDIO_CONFIRM_FAILED';
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
  rejectionReason?: string | null;
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
  displayName: string;
  errorCode?: ReportAssetValidationErrorCode | ReportAttachmentErrorCode;
  fileName: string;
  height?: number;
  id: string;
  mimeType: string;
  ownership: ReportAssetFileOwnership;
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
  displayName?: string;
  durationSeconds?: number;
  fileName: string;
  height?: number;
  mimeType: string;
  ownership: ReportAssetFileOwnership;
  size: number;
  type: ReportAssetType;
  uri: string;
  width?: number;
}

export interface IReportAssetDownloadUrl {
  expiresAt: string;
  url: string;
}
