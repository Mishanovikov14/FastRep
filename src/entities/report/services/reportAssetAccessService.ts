import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

import { getActiveAppEnvironment } from '@/entities/environment/services/appEnvironmentService';
import { createReportAssetDownloadUrl } from '@/entities/report/API/reportAssetsApi';
import type { IReportAsset } from '@/entities/report/types/reportAsset';

export type ReportAssetAccessErrorCode =
  | 'ASSET_DOWNLOAD_REQUEST_FAILED'
  | 'ASSET_DOWNLOAD_FAILED'
  | 'ASSET_VIEWER_UNAVAILABLE';

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
  const mimeType = asset.verifiedMimeType ?? asset.declaredMimeType;
  const extension = extensionByMimeType[mimeType] ?? 'bin';

  return `${RNFS.CachesDirectoryPath}/${CACHE_PREFIX}${environment}-${reportId}-${asset.id}.${extension}`;
};

const removePartialDownload = async (path: string): Promise<void> => {
  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
  }
};

const downloadFreshAsset = async (reportId: string, asset: IReportAsset, path: string): Promise<void> => {
  const response = await createReportAssetDownloadUrl(reportId, asset.id);

  if (response.isError || !response.data) {
    throw new ReportAssetAccessError('ASSET_DOWNLOAD_REQUEST_FAILED', response.status);
  }

  const result = await RNFS.downloadFile({ fromUrl: response.data.url, toFile: path }).promise;
  if (result.statusCode < 200 || result.statusCode >= 300) {
    throw new ReportAssetAccessError('ASSET_DOWNLOAD_FAILED', result.statusCode);
  }
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
      return path;
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

  try {
    await FileViewer.open(path, { showOpenWithDialog: true });
  } catch {
    throw new ReportAssetAccessError('ASSET_VIEWER_UNAVAILABLE');
  }
};
