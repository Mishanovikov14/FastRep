import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { Asset } from 'react-native-image-picker';

import { reportAssetLimits, supportedAssetMimeTypes } from '@/entities/report/config/reportAssetLimits';
import { sanitizeAssetFileName } from '@/entities/report/model/reportAssetValidation';
import type { IReportAssetCandidate } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';

export type ReportFilePickerErrorCode =
  | 'copy_failed'
  | 'file_unreadable'
  | 'heic_conversion_failed'
  | 'picker_failed'
  | 'unsupported_type';

export class ReportFilePickerError extends Error {
  constructor(public readonly code: ReportFilePickerErrorCode) {
    super(code);
    this.name = 'ReportFilePickerError';
  }
}

const extensionByMimeType: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-m4a': 'm4a',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/csv': 'csv',
  'text/plain': 'txt',
};

const mimeTypeByExtension = Object.fromEntries(
  Object.entries(extensionByMimeType).map(([mimeType, extension]) => [extension, mimeType]),
);

const getExtension = (fileName?: string): string | undefined => {
  const match = fileName?.toLowerCase().match(/\.([a-z0-9]+)$/u);
  return match?.[1];
};

const getMimeType = (mimeType?: string | null, fileName?: string): string | undefined => {
  const normalizedMimeType = mimeType?.toLowerCase();
  const extensionMimeType = getExtension(fileName) ? mimeTypeByExtension[getExtension(fileName) as string] : undefined;

  return normalizedMimeType && normalizedMimeType !== 'application/octet-stream'
    ? normalizedMimeType
    : extensionMimeType;
};

const getUriScheme = (uri: string): string => uri.match(/^([a-z][a-z0-9+.-]*):/iu)?.[1]?.toLowerCase() ?? 'path';

const getStatSize = async (uri: string): Promise<number> => {
  const path = uri.startsWith('file://') ? decodeURI(uri.slice('file://'.length)) : uri;
  let stat;

  try {
    stat = await RNFS.stat(path);
  } catch {
    throw new ReportFilePickerError('file_unreadable');
  }

  const size = Number(stat.size);

  if (!Number.isFinite(size) || size <= 0) {
    throw new ReportFilePickerError('file_unreadable');
  }

  return size;
};

const cleanupTemporaryFile = async (uri: string, assetType: 'DOCUMENT' | 'IMAGE'): Promise<void> => {
  if (!uri.startsWith('file://')) {
    return;
  }

  const path = decodeURI(uri.slice('file://'.length));

  try {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
      logger.debug('report.picker_temporary_file_removed', { assetType, uriScheme: 'file' });
    }
  } catch {
    logger.warn('report.picker_temporary_file_cleanup_failed', { assetType, uriScheme: 'file' });
  }
};

const toImageCandidate = async (asset: Asset): Promise<IReportAssetCandidate> => {
  if (!asset.uri) {
    throw new ReportFilePickerError('file_unreadable');
  }

  const declaredMimeType = asset.type?.toLowerCase();
  const mimeType = getMimeType(declaredMimeType, asset.fileName ?? asset.uri);
  const extension = getExtension(asset.fileName ?? asset.uri);

  if (
    declaredMimeType === 'image/heic' ||
    declaredMimeType === 'image/heif' ||
    (!declaredMimeType && (extension === 'heic' || extension === 'heif'))
  ) {
    logger.error('report.image_conversion_failed', { errorCode: 'heic_conversion_failed', source: 'image_picker' });
    throw new ReportFilePickerError('heic_conversion_failed');
  }

  if (!mimeType || !(supportedAssetMimeTypes.IMAGE as readonly string[]).includes(mimeType)) {
    throw new ReportFilePickerError('unsupported_type');
  }

  if (extension && (extension === 'heic' || extension === 'heif') && mimeType === 'image/jpeg') {
    logger.info('report.image_conversion_completed', { assetType: 'IMAGE', mimeType, source: 'image_picker' });
  }

  if (!asset.fileSize || asset.fileSize <= 0) {
    logger.debug('report.image_file_stat_started', { assetType: 'IMAGE', uriScheme: getUriScheme(asset.uri) });
  }
  const size = asset.fileSize && asset.fileSize > 0 ? asset.fileSize : await getStatSize(asset.uri);
  const resolvedExtension = extensionByMimeType[mimeType] ?? 'jpg';
  const originalFileName = asset.fileName ?? `photo-${Date.now()}.${resolvedExtension}`;
  const resolvedFileName = extension === resolvedExtension
    ? originalFileName
    : `${originalFileName.replace(/\.[^.]+$/u, '')}.${resolvedExtension}`;

  logger.debug('report.image_selected', {
    assetType: 'IMAGE',
    mimeType,
    size,
    uriScheme: getUriScheme(asset.uri),
  });

  return {
    fileName: sanitizeAssetFileName(resolvedFileName, resolvedExtension),
    height: asset.height,
    mimeType,
    size,
    type: 'IMAGE',
    uri: asset.uri,
    width: asset.width,
  };
};

const imageOptions = {
  assetRepresentationMode: 'compatible' as const,
  conversionQuality: 0.9,
  maxHeight: reportAssetLimits.imageMaxHeight,
  maxWidth: reportAssetLimits.imageMaxWidth,
  mediaType: 'photo' as const,
  quality: 0.9 as const,
  restrictMimeTypes: [...supportedAssetMimeTypes.IMAGE, 'image/heic', 'image/heif'],
  selectionLimit: 1,
};

export const pickReportImage = async (source: 'camera' | 'library'): Promise<IReportAssetCandidate | undefined> => {
  logger.debug('report.image_picker_opened', { assetType: 'IMAGE', source });
  let response;

  try {
    response = source === 'camera' ? await launchCamera(imageOptions) : await launchImageLibrary(imageOptions);
  } catch {
    logger.error('report.image_picker_failed', { assetType: 'IMAGE', errorCode: 'picker_failed', source });
    throw new ReportFilePickerError('picker_failed');
  }

  if (response.didCancel) {
    logger.debug('report.image_picker_cancelled', { assetType: 'IMAGE', source });
    return undefined;
  }

  if (response.errorCode) {
    logger.error('report.image_picker_failed', { assetType: 'IMAGE', errorCode: response.errorCode, source });
    throw new ReportFilePickerError('picker_failed');
  }

  const asset = response.assets?.[0];
  if (!asset) {
    logger.error('report.image_picker_failed', { assetType: 'IMAGE', errorCode: 'file_unreadable', source });
    throw new ReportFilePickerError('file_unreadable');
  }

  try {
    return await toImageCandidate(asset);
  } catch (error) {
    await cleanupTemporaryFile(asset.uri ?? '', 'IMAGE');
    const errorCode = error instanceof ReportFilePickerError ? error.code : 'file_unreadable';
    if (errorCode !== 'heic_conversion_failed') {
      logger.error('report.image_picker_failed', { assetType: 'IMAGE', errorCode, source });
    }
    throw error instanceof ReportFilePickerError ? error : new ReportFilePickerError('file_unreadable');
  }
};

export const pickReportDocument = async (): Promise<IReportAssetCandidate | undefined> => {
  logger.debug('report.document_picker_opened', { assetType: 'DOCUMENT' });
  let copiedUri: string | undefined;

  try {
    const [document] = await pick({
      allowMultiSelection: false,
      mode: 'import',
      type: [...supportedAssetMimeTypes.DOCUMENT],
    });

    if (document.error || document.hasRequestedType === false) {
      throw new ReportFilePickerError(document.hasRequestedType === false ? 'unsupported_type' : 'file_unreadable');
    }

    const mimeType = getMimeType(document.type, document.name ?? undefined);
    if (!mimeType || !(supportedAssetMimeTypes.DOCUMENT as readonly string[]).includes(mimeType)) {
      throw new ReportFilePickerError('unsupported_type');
    }

    const extension = extensionByMimeType[mimeType] ?? 'bin';
    const fileName = sanitizeAssetFileName(document.name ?? `document-${Date.now()}.${extension}`, extension);
    logger.debug('report.document_cache_copy_started', {
      assetType: 'DOCUMENT',
      mimeType,
      uriScheme: getUriScheme(document.uri),
    });
    const [copy] = await keepLocalCopy({
      destination: 'cachesDirectory',
      files: [{ fileName, uri: document.uri }],
    });

    if (copy.status !== 'success') {
      throw new ReportFilePickerError('copy_failed');
    }

    copiedUri = copy.localUri;
    logger.debug('report.document_cache_copy_completed', {
      assetType: 'DOCUMENT',
      mimeType,
      uriScheme: getUriScheme(copy.localUri),
    });
    const size = await getStatSize(copy.localUri);
    logger.debug('report.document_selected', {
      assetType: 'DOCUMENT',
      mimeType,
      size,
      uriScheme: getUriScheme(copy.localUri),
    });

    return {
      fileName,
      mimeType,
      size,
      type: 'DOCUMENT',
      uri: copy.localUri,
    };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      logger.debug('report.document_picker_cancelled', { assetType: 'DOCUMENT' });
      return undefined;
    }

    if (copiedUri) {
      await cleanupTemporaryFile(copiedUri, 'DOCUMENT');
    }
    const errorCode = error instanceof ReportFilePickerError ? error.code : 'picker_failed';
    logger.error('report.document_picker_failed', { assetType: 'DOCUMENT', errorCode });
    throw error instanceof ReportFilePickerError ? error : new ReportFilePickerError('picker_failed');
  }
};
