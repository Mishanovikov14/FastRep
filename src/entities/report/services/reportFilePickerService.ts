import { errorCodes, isErrorWithCode, keepLocalCopy, pick } from '@react-native-documents/picker';
import { Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { Asset } from 'react-native-image-picker';

import { reportAssetLimits, supportedAssetMimeTypes } from '@/entities/report/config/reportAssetLimits';
import { ReportAttachmentError } from '@/entities/report/model/ReportAttachmentError';
import { sanitizeAssetFileName } from '@/entities/report/model/reportAssetValidation';
import { getUriScheme, logAttachmentStage } from '@/entities/report/services/reportAttachmentDiagnostics';
import {
  cleanupOwnedLocalFile,
  getReadableLocalFileSize,
  normalizeLocalFilePath,
  ReportLocalFileError,
} from '@/entities/report/services/reportLocalFileService';
import type { IReportAssetCandidate, IReportImageSelection } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';

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
  const match = fileName?.toLowerCase().match(/\.([a-z0-9]+)(?:$|[?#])/u);
  return match?.[1];
};

const getMimeType = (mimeType?: string | null, fileName?: string): string | undefined => {
  const normalizedMimeType = mimeType?.toLowerCase();
  const extension = getExtension(fileName);
  const extensionMimeType = extension ? mimeTypeByExtension[extension] : undefined;

  return normalizedMimeType && normalizedMimeType !== 'application/octet-stream'
    ? normalizedMimeType
    : extensionMimeType;
};

const assertReadableImageUri = (uri: string): void => {
  try {
    normalizeLocalFilePath(uri);
  } catch (error) {
    if (error instanceof ReportLocalFileError && error.code === 'URI_UNSUPPORTED') {
      throw new ReportAttachmentError('IMAGE', 'IMAGE_URI_UNSUPPORTED', 'FILE_NORMALIZATION');
    }

    throw error;
  }
};

const getImageSize = async (uri: string): Promise<number> => {
  logAttachmentStage('IMAGE', 'FILE_STAT', { platform: Platform.OS, uriScheme: getUriScheme(uri) });

  try {
    return await getReadableLocalFileSize(uri);
  } catch (error) {
    if (error instanceof ReportLocalFileError && error.code === 'URI_UNSUPPORTED') {
      throw new ReportAttachmentError('IMAGE', 'IMAGE_URI_UNSUPPORTED', 'FILE_STAT');
    }

    throw new ReportAttachmentError('IMAGE', 'IMAGE_FILE_UNREADABLE', 'FILE_STAT');
  }
};

const toImageCandidate = async (asset: IReportImageSelection): Promise<IReportAssetCandidate> => {
  if (!asset.uri) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_URI_MISSING', 'PICKER_RETURNED');
  }

  logAttachmentStage('IMAGE', 'METADATA_NORMALIZING', {
    platform: Platform.OS,
    uriScheme: getUriScheme(asset.uri),
  });
  assertReadableImageUri(asset.uri);

  const declaredMimeType = asset.mimeType?.toLowerCase();
  const mimeType = getMimeType(declaredMimeType, asset.fileName ?? asset.uri);
  const extension = getExtension(asset.fileName ?? asset.uri);

  if (
    declaredMimeType === 'image/heic' ||
    declaredMimeType === 'image/heif' ||
    (!declaredMimeType && (extension === 'heic' || extension === 'heif'))
  ) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_HEIC_CONVERSION_FAILED', 'METADATA_NORMALIZING');
  }

  if (!mimeType) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_MIME_MISSING', 'METADATA_NORMALIZING');
  }

  if (!(supportedAssetMimeTypes.IMAGE as readonly string[]).includes(mimeType)) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_UNSUPPORTED_TYPE', 'METADATA_NORMALIZING');
  }

  const size = await getImageSize(asset.uri);
  const resolvedExtension = extensionByMimeType[mimeType] ?? 'jpg';
  const originalFileName = asset.fileName ?? `photo-${Date.now()}.${resolvedExtension}`;
  const resolvedFileName =
    extension === resolvedExtension
      ? originalFileName
      : `${originalFileName.replace(/\.[^.]+$/u, '')}.${resolvedExtension}`;

  return {
    fileName: sanitizeAssetFileName(resolvedFileName, resolvedExtension),
    height: asset.height,
    mimeType,
    ownership: 'SYSTEM_OWNED',
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
};

const toImageSelection = (asset: Asset): IReportImageSelection => ({
  fileName: asset.fileName,
  fileSize: asset.fileSize,
  height: asset.height,
  mimeType: asset.type,
  uri: asset.uri,
  width: asset.width,
});

export const normalizeReportImageSelection = (selection: IReportImageSelection): Promise<IReportAssetCandidate> =>
  toImageCandidate(selection);

export const pickReportImage = async (source: 'camera' | 'library'): Promise<IReportAssetCandidate | undefined> => {
  logAttachmentStage('IMAGE', 'PICKER_OPENING', { platform: Platform.OS, source });
  let response;

  try {
    response =
      source === 'camera'
        ? await launchCamera(imageOptions)
        : await launchImageLibrary({ ...imageOptions, selectionLimit: 1 });
  } catch {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_PICKER_FAILED', 'PICKER_OPENING');
  }

  if (response.didCancel) {
    logAttachmentStage('IMAGE', 'PICKER_RETURNED', { platform: Platform.OS, source, status: 'cancelled' });
    return undefined;
  }

  if (response.errorCode) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_PICKER_FAILED', 'PICKER_RETURNED');
  }

  const asset = response.assets?.[0];
  logAttachmentStage('IMAGE', 'PICKER_RETURNED', {
    declaredMimeType: asset?.type?.toLowerCase(),
    hasFileName: Boolean(asset?.fileName),
    hasFileSize: typeof asset?.fileSize === 'number' && asset.fileSize > 0,
    hasUri: Boolean(asset?.uri),
    height: asset?.height,
    platform: Platform.OS,
    source,
    uriScheme: asset?.uri ? getUriScheme(asset.uri) : undefined,
    width: asset?.width,
  });

  if (!asset) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_URI_MISSING', 'PICKER_RETURNED');
  }

  return toImageCandidate(toImageSelection(asset));
};

export const pickReportImages = async (selectionLimit: number): Promise<IReportImageSelection[] | undefined> => {
  logAttachmentStage('IMAGE', 'PICKER_OPENING', {
    platform: Platform.OS,
    source: 'library',
  });
  let response;

  try {
    response = await launchImageLibrary({
      ...imageOptions,
      selectionLimit: Math.max(1, selectionLimit),
    });
  } catch {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_PICKER_FAILED', 'PICKER_OPENING');
  }

  if (response.didCancel) {
    logAttachmentStage('IMAGE', 'PICKER_RETURNED', {
      platform: Platform.OS,
      source: 'library',
      status: 'cancelled',
    });
    return undefined;
  }
  if (response.errorCode) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_PICKER_FAILED', 'PICKER_RETURNED');
  }

  const selections = (response.assets ?? []).map(toImageSelection);
  if (selections.length === 0) {
    throw new ReportAttachmentError('IMAGE', 'IMAGE_URI_MISSING', 'PICKER_RETURNED');
  }
  logger.info('report.multi_photo_batch_selected', {
    assetCount: selections.length,
    assetType: 'IMAGE',
    platform: Platform.OS,
  });
  return selections;
};

const cleanupCopiedDocument = async (uri: string): Promise<void> => {
  try {
    if (await cleanupOwnedLocalFile(uri, 'APP_TEMPORARY')) {
      logger.debug('report.temporary_asset_removed', { assetType: 'DOCUMENT', uriScheme: getUriScheme(uri) });
    }
  } catch {
    logger.warn('report.temporary_asset_cleanup_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'DOCUMENT_FILE_UNREADABLE',
      uriScheme: getUriScheme(uri),
    });
  }
};

export const pickReportDocument = async (): Promise<IReportAssetCandidate | undefined> => {
  logAttachmentStage('DOCUMENT', 'PICKER_OPENING', { platform: Platform.OS });
  let document;

  try {
    [document] = await pick({
      allowMultiSelection: false,
      mode: 'import',
      type: [...supportedAssetMimeTypes.DOCUMENT],
    });
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      logAttachmentStage('DOCUMENT', 'PICKER_RETURNED', { platform: Platform.OS, status: 'cancelled' });
      return undefined;
    }

    throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_PICKER_FAILED', 'PICKER_OPENING');
  }

  logAttachmentStage('DOCUMENT', 'PICKER_RETURNED', {
    declaredMimeType: document?.type ?? undefined,
    hasFileName: Boolean(document?.name),
    hasFileSize: typeof document?.size === 'number' && document.size > 0,
    hasUri: Boolean(document?.uri),
    platform: Platform.OS,
    uriScheme: document?.uri ? getUriScheme(document.uri) : undefined,
  });

  if (!document?.uri) {
    throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_URI_MISSING', 'PICKER_RETURNED');
  }

  if (document.error) {
    throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_PICKER_FAILED', 'PICKER_RETURNED');
  }

  logAttachmentStage('DOCUMENT', 'METADATA_NORMALIZING', {
    platform: Platform.OS,
    uriScheme: getUriScheme(document.uri),
  });
  const mimeType = getMimeType(document.type, document.name ?? undefined);

  if (!mimeType) {
    throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_MIME_MISSING', 'METADATA_NORMALIZING');
  }

  if (
    document.hasRequestedType === false ||
    !(supportedAssetMimeTypes.DOCUMENT as readonly string[]).includes(mimeType)
  ) {
    throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_UNSUPPORTED_TYPE', 'METADATA_NORMALIZING');
  }

  const extension = extensionByMimeType[mimeType] ?? 'bin';
  const fileName = sanitizeAssetFileName(document.name ?? `document-${Date.now()}.${extension}`, extension);
  logAttachmentStage('DOCUMENT', 'FILE_NORMALIZATION', {
    platform: Platform.OS,
    uriScheme: getUriScheme(document.uri),
  });
  let copiedUri: string | undefined;

  try {
    const [copy] = await keepLocalCopy({
      destination: 'cachesDirectory',
      files: [{ fileName, uri: document.uri }],
    });

    if (copy.status !== 'success' || !copy.localUri) {
      throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_COPY_FAILED', 'FILE_NORMALIZATION');
    }

    copiedUri = copy.localUri;
  } catch (error) {
    if (error instanceof ReportAttachmentError) {
      throw error;
    }

    throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_COPY_FAILED', 'FILE_NORMALIZATION');
  }

  logAttachmentStage('DOCUMENT', 'FILE_STAT', {
    platform: Platform.OS,
    uriScheme: getUriScheme(copiedUri),
  });

  try {
    const size = await getReadableLocalFileSize(copiedUri);

    return {
      displayName: document.name ?? undefined,
      fileName,
      mimeType,
      ownership: 'APP_TEMPORARY',
      size,
      type: 'DOCUMENT',
      uri: copiedUri,
    };
  } catch {
    await cleanupCopiedDocument(copiedUri);
    throw new ReportAttachmentError('DOCUMENT', 'DOCUMENT_FILE_UNREADABLE', 'FILE_STAT');
  }
};
