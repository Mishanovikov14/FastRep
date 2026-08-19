import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

import { getActiveAppEnvironment } from '@/entities/environment/services/appEnvironmentService';
import { createReportAssetDownloadUrl } from '@/entities/report/API/reportAssetsApi';
import {
  openLocalReportDocument,
  ReportDocumentViewerError,
} from '@/entities/report/services/reportDocumentViewerService';
import type { IReportAsset } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';

export type ReportAssetAccessErrorCode =
  | 'ASSET_DOWNLOAD_REQUEST_FAILED'
  | 'ASSET_DOWNLOAD_FAILED'
  | 'ASSET_LOCAL_FILE_INVALID'
  | 'ASSET_VIEWER_UNAVAILABLE'
  | 'ASSET_VIEW_FAILED';

export class ReportAssetAccessError extends Error {
  constructor(public readonly code: ReportAssetAccessErrorCode, public readonly httpStatus?: number) {
    super(code);
    this.name = 'ReportAssetAccessError';
  }
}

const CACHE_PREFIX = 'FastRep-asset-';
const MAX_CACHED_ASSETS = 24;
const inFlightDownloads = new Map<string, Promise<string>>();

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

const getCachePath = (reportId: string, asset: IReportAsset): string => {
  const environment = getActiveAppEnvironment().key;
  const mimeType = (asset.verifiedMimeType ?? asset.declaredMimeType).toLowerCase();
  const extension = extensionByMimeType[mimeType] ?? 'bin';

  return `${RNFS.CachesDirectoryPath}/${CACHE_PREFIX}${environment}-${reportId}-${asset.id}.${extension}`;
};

const removePartialDownload = async (path: string): Promise<void> => {
  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
  }
};

const assertDownloadedFileIsReadable = async (path: string, assetType: IReportAsset['type']): Promise<void> => {
  let size: number;

  try {
    size = Number((await RNFS.stat(path)).size);
  } catch {
    logger.warn('report.attachment_local_file_validation_failed', {
      assetType,
      errorCode: 'ASSET_DOWNLOAD_FAILED',
      platform: Platform.OS,
      stage: 'LOCAL_FILE_VALIDATION',
    });
    throw new ReportAssetAccessError('ASSET_DOWNLOAD_FAILED');
  }

  if (!Number.isFinite(size) || size <= 0) {
    logger.warn('report.attachment_local_file_validation_failed', {
      assetType,
      errorCode: 'ASSET_DOWNLOAD_FAILED',
      platform: Platform.OS,
      stage: 'LOCAL_FILE_VALIDATION',
    });
    throw new ReportAssetAccessError('ASSET_DOWNLOAD_FAILED');
  }
};

const downloadFreshAsset = async (reportId: string, asset: IReportAsset, path: string): Promise<void> => {
  logger.debug('report.attachment_download_url_request_started', {
    assetType: asset.type,
    platform: Platform.OS,
    stage: 'DOWNLOAD_URL_REQUEST',
  });
  const response = await createReportAssetDownloadUrl(reportId, asset.id);

  if (response.isError || !response.data) {
    logger.warn('report.attachment_download_url_request_failed', {
      assetType: asset.type,
      errorCode: 'ASSET_DOWNLOAD_REQUEST_FAILED',
      httpStatus: response.status,
      platform: Platform.OS,
      stage: 'DOWNLOAD_URL_REQUEST',
    });
    throw new ReportAssetAccessError('ASSET_DOWNLOAD_REQUEST_FAILED', response.status);
  }

  logger.debug('report.attachment_download_started', {
    assetType: asset.type,
    platform: Platform.OS,
    stage: 'DOWNLOAD',
  });
  const result = await RNFS.downloadFile({ fromUrl: response.data.url, toFile: path }).promise;
  if (result.statusCode < 200 || result.statusCode >= 300) {
    logger.warn('report.attachment_download_failed', {
      assetType: asset.type,
      errorCode: 'ASSET_DOWNLOAD_FAILED',
      httpStatus: result.statusCode,
      platform: Platform.OS,
      stage: 'DOWNLOAD',
    });
    throw new ReportAssetAccessError('ASSET_DOWNLOAD_FAILED', result.statusCode);
  }

  await assertDownloadedFileIsReadable(path, asset.type);
};

export const cleanupReportAssetCache = async (): Promise<void> => {
  const files = (await RNFS.readDir(RNFS.CachesDirectoryPath))
    .filter((file) => file.isFile() && file.name.startsWith(CACHE_PREFIX))
    .sort((left, right) => (right.mtime?.getTime() ?? 0) - (left.mtime?.getTime() ?? 0));

  await Promise.all(files.slice(MAX_CACHED_ASSETS).map((file) => RNFS.unlink(file.path)));
};

export const removeReportAssetCache = async (assetId: string): Promise<void> => {
  const files = (await RNFS.readDir(RNFS.CachesDirectoryPath)).filter(
    (file) => file.isFile() && file.name.startsWith(CACHE_PREFIX) && file.name.includes(`-${assetId}.`),
  );

  await Promise.all(files.map((file) => RNFS.unlink(file.path)));
};

export const ensureReportAssetFile = (reportId: string, asset: IReportAsset): Promise<string> => {
  const path = getCachePath(reportId, asset);
  const existing = inFlightDownloads.get(path);

  if (existing) {
    return existing;
  }

  const operation = (async () => {
    if (await RNFS.exists(path)) {
      try {
        await assertDownloadedFileIsReadable(path, asset.type);
        return path;
      } catch {
        await removePartialDownload(path);
      }
    }

    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await downloadFreshAsset(reportId, asset, path);
        await cleanupReportAssetCache();
        return path;
      } catch (error) {
        lastError = error;
        await removePartialDownload(path);
      }
    }

    if (lastError instanceof ReportAssetAccessError) {
      throw lastError;
    }

    throw new ReportAssetAccessError('ASSET_DOWNLOAD_FAILED');
  })().finally(() => inFlightDownloads.delete(path));

  inFlightDownloads.set(path, operation);
  return operation;
};

export const openReportDocumentAsset = async (reportId: string, asset: IReportAsset): Promise<void> => {
  const path = await ensureReportAssetFile(reportId, asset);
  const mimeType = (asset.verifiedMimeType ?? asset.declaredMimeType).toLowerCase();

  try {
    await openLocalReportDocument({ headerTitle: asset.originalFileName, mimeType, path });
  } catch (error) {
    if (error instanceof ReportDocumentViewerError) {
      if (error.code === 'VIEWER_UNAVAILABLE') {
        throw new ReportAssetAccessError('ASSET_VIEWER_UNAVAILABLE');
      }

      if (error.code === 'VIEW_FAILED') {
        throw new ReportAssetAccessError('ASSET_VIEW_FAILED');
      }

      throw new ReportAssetAccessError('ASSET_LOCAL_FILE_INVALID');
    }

    throw new ReportAssetAccessError('ASSET_VIEW_FAILED');
  }
};
