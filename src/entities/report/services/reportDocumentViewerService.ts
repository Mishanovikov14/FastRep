import { errorCodes, isErrorWithCode, viewDocument } from '@react-native-documents/viewer';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

import { normalizeLocalFilePath } from '@/entities/report/services/reportLocalFileService';
import { logger } from '@/libs/logger/logger';

export type ReportDocumentViewerErrorCode =
  | 'LOCAL_FILE_MISSING'
  | 'LOCAL_FILE_EMPTY'
  | 'LOCAL_FILE_EXTENSION_MISMATCH'
  | 'VIEWER_UNAVAILABLE'
  | 'VIEW_FAILED';

export class ReportDocumentViewerError extends Error {
  constructor(public readonly code: ReportDocumentViewerErrorCode) {
    super(code);
    this.name = 'ReportDocumentViewerError';
  }
}

const extensionByMimeType: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/csv': 'csv',
  'text/plain': 'txt',
};

const getPathExtension = (path: string): string | undefined => {
  return path.toLowerCase().match(/\.([a-z0-9]+)(?:$|[?#])/u)?.[1];
};

const toFileUri = (path: string): string => (path.startsWith('file://') ? path : `file://${path}`);

export const validateLocalReportDocument = async (path: string, mimeType: string): Promise<void> => {
  const localPath = normalizeLocalFilePath(path);
  const extension = getPathExtension(localPath);
  const expectedExtension = extensionByMimeType[mimeType];
  logger.debug('report.document_local_file_validation_started', {
    assetType: 'DOCUMENT',
    extension,
    mimeType,
    platform: Platform.OS,
    stage: 'LOCAL_FILE_VALIDATION',
  });

  if (!(await RNFS.exists(localPath))) {
    logger.warn('report.document_local_file_validation_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'LOCAL_FILE_MISSING',
      extension,
      mimeType,
      platform: Platform.OS,
      stage: 'LOCAL_FILE_VALIDATION',
    });
    throw new ReportDocumentViewerError('LOCAL_FILE_MISSING');
  }

  let size: number;

  try {
    size = Number((await RNFS.stat(localPath)).size);
  } catch {
    logger.warn('report.document_local_file_validation_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'LOCAL_FILE_MISSING',
      extension,
      mimeType,
      platform: Platform.OS,
      stage: 'LOCAL_FILE_VALIDATION',
    });
    throw new ReportDocumentViewerError('LOCAL_FILE_MISSING');
  }

  if (!Number.isFinite(size) || size <= 0) {
    logger.warn('report.document_local_file_validation_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'LOCAL_FILE_EMPTY',
      extension,
      mimeType,
      platform: Platform.OS,
      stage: 'LOCAL_FILE_VALIDATION',
    });
    throw new ReportDocumentViewerError('LOCAL_FILE_EMPTY');
  }

  if (!expectedExtension || extension !== expectedExtension) {
    logger.warn('report.document_local_file_validation_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'LOCAL_FILE_EXTENSION_MISMATCH',
      extension,
      mimeType,
      platform: Platform.OS,
      stage: 'LOCAL_FILE_VALIDATION',
    });
    throw new ReportDocumentViewerError('LOCAL_FILE_EXTENSION_MISMATCH');
  }
};

interface IOpenLocalReportDocumentInput {
  headerTitle?: string;
  mimeType: string;
  path: string;
}

export const openLocalReportDocument = async ({
  headerTitle,
  mimeType,
  path,
}: IOpenLocalReportDocumentInput): Promise<void> => {
  await validateLocalReportDocument(path, mimeType);
  const localPath = normalizeLocalFilePath(path);
  const extension = getPathExtension(localPath);

  logger.debug('report.document_view_started', {
    assetType: 'DOCUMENT',
    extension,
    mimeType,
    platform: Platform.OS,
    stage: 'VIEW',
    uriScheme: 'file',
  });

  try {
    await viewDocument({
      grantPermissions: 'read',
      headerTitle,
      mimeType,
      uri: toFileUri(localPath),
    });
  } catch (error) {
    const code =
      isErrorWithCode(error) && error.code === errorCodes.UNABLE_TO_OPEN_FILE_TYPE
        ? 'VIEWER_UNAVAILABLE'
        : 'VIEW_FAILED';
    logger.warn('report.document_view_failed', {
      assetType: 'DOCUMENT',
      errorCode: code,
      extension,
      mimeType,
      platform: Platform.OS,
      stage: 'VIEW',
    });
    throw new ReportDocumentViewerError(code);
  }
};
