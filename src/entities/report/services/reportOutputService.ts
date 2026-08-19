import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { getActiveAppEnvironment } from '@/entities/environment/services/appEnvironmentService';
import { createReportOutputDownloadUrl } from '@/entities/report/API/reportGenerationsApi';
import {
  openLocalReportDocument,
  ReportDocumentViewerError,
} from '@/entities/report/services/reportDocumentViewerService';
import { logger } from '@/libs/logger/logger';

export type ReportOutputAccessErrorCode =
  | 'OUTPUT_DOWNLOAD_FAILED'
  | 'OUTPUT_LOCAL_FILE_INVALID'
  | 'OUTPUT_VIEWER_UNAVAILABLE'
  | 'OUTPUT_VIEW_FAILED';

export class ReportOutputAccessError extends Error {
  constructor(public readonly code: ReportOutputAccessErrorCode) {
    super(code);
    this.name = 'ReportOutputAccessError';
  }
}

const CACHE_PREFIX = 'FastRep-output-';
const MAX_CACHED_OUTPUTS = 10;
const INVALID_FILENAME_CHARACTERS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
const inFlightDownloads = new Map<string, Promise<string>>();

const downloadOutput = async (reportId: string, cachePath: string): Promise<boolean> => {
  logger.debug('report.output_download_url_request_started', {
    assetType: 'DOCUMENT',
    platform: Platform.OS,
    stage: 'DOWNLOAD_URL_REQUEST',
  });
  const response = await createReportOutputDownloadUrl(reportId);

  if (response.isError || !response.data) {
    logger.warn('report.output_download_url_request_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'OUTPUT_DOWNLOAD_FAILED',
      httpStatus: response.status,
      platform: Platform.OS,
      stage: 'DOWNLOAD_URL_REQUEST',
    });
    return false;
  }

  logger.debug('report.output_download_started', {
    assetType: 'DOCUMENT',
    mimeType: 'application/pdf',
    platform: Platform.OS,
    stage: 'DOWNLOAD',
  });
  const download = await RNFS.downloadFile({ fromUrl: response.data.url, toFile: cachePath }).promise;
  if (download.statusCode < 200 || download.statusCode >= 300) {
    logger.warn('report.output_download_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'OUTPUT_DOWNLOAD_FAILED',
      httpStatus: download.statusCode,
      mimeType: 'application/pdf',
      platform: Platform.OS,
      stage: 'DOWNLOAD',
    });
  }
  return download.statusCode >= 200 && download.statusCode < 300;
};

const isReadableOutputFile = async (path: string): Promise<boolean> => {
  try {
    const size = Number((await RNFS.stat(path)).size);

    const isReadable = Number.isFinite(size) && size > 0;
    if (!isReadable) {
      logger.warn('report.output_local_file_validation_failed', {
        assetType: 'DOCUMENT',
        errorCode: 'OUTPUT_LOCAL_FILE_INVALID',
        extension: 'pdf',
        mimeType: 'application/pdf',
        platform: Platform.OS,
        stage: 'LOCAL_FILE_VALIDATION',
      });
    }

    return isReadable;
  } catch {
    logger.warn('report.output_local_file_validation_failed', {
      assetType: 'DOCUMENT',
      errorCode: 'OUTPUT_LOCAL_FILE_INVALID',
      extension: 'pdf',
      mimeType: 'application/pdf',
      platform: Platform.OS,
      stage: 'LOCAL_FILE_VALIDATION',
    });
    return false;
  }
};

const getCachePath = (reportId: string, generationId: string): string => {
  const environment = getActiveAppEnvironment().key;

  return `${RNFS.CachesDirectoryPath}/${CACHE_PREFIX}${environment}-${reportId}-${generationId}.pdf`;
};

export const cleanupReportOutputCache = async (): Promise<void> => {
  const files = (await RNFS.readDir(RNFS.CachesDirectoryPath))
    .filter((file) => file.isFile() && file.name.startsWith(CACHE_PREFIX) && file.name.endsWith('.pdf'))
    .sort((left, right) => (right.mtime?.getTime() ?? 0) - (left.mtime?.getTime() ?? 0));

  await Promise.all(files.slice(MAX_CACHED_OUTPUTS).map((file) => RNFS.unlink(file.path)));
};

export const ensureReportOutputFile = (reportId: string, generationId: string): Promise<string> => {
  const cachePath = getCachePath(reportId, generationId);
  const existing = inFlightDownloads.get(cachePath);

  if (existing) {
    return existing;
  }

  const operation = (async () => {
    if (await RNFS.exists(cachePath)) {
      if (await isReadableOutputFile(cachePath)) {
        return cachePath;
      }

      await RNFS.unlink(cachePath);
    }

    let didDownload = await downloadOutput(reportId, cachePath);

    if (didDownload && !(await isReadableOutputFile(cachePath))) {
      didDownload = false;
    }

    if (!didDownload) {
      if (await RNFS.exists(cachePath)) {
        await RNFS.unlink(cachePath);
      }
      didDownload = await downloadOutput(reportId, cachePath);
    }

    if (didDownload && !(await isReadableOutputFile(cachePath))) {
      didDownload = false;
    }

    if (!didDownload) {
      if (await RNFS.exists(cachePath)) {
        await RNFS.unlink(cachePath);
      }
      throw new ReportOutputAccessError('OUTPUT_DOWNLOAD_FAILED');
    }

    await cleanupReportOutputCache();
    return cachePath;
  })().finally(() => inFlightDownloads.delete(cachePath));

  inFlightDownloads.set(cachePath, operation);
  return operation;
};

export const openReportOutput = async (reportId: string, generationId: string): Promise<void> => {
  const path = await ensureReportOutputFile(reportId, generationId);

  try {
    await openLocalReportDocument({ mimeType: 'application/pdf', path });
  } catch (error) {
    if (error instanceof ReportDocumentViewerError) {
      if (error.code === 'VIEWER_UNAVAILABLE') {
        throw new ReportOutputAccessError('OUTPUT_VIEWER_UNAVAILABLE');
      }

      if (error.code === 'VIEW_FAILED') {
        throw new ReportOutputAccessError('OUTPUT_VIEW_FAILED');
      }

      throw new ReportOutputAccessError('OUTPUT_LOCAL_FILE_INVALID');
    }

    throw new ReportOutputAccessError('OUTPUT_VIEW_FAILED');
  }
};

export const getReportOutputShareFileName = (title: string): string => {
  const normalizedTitle = Array.from(title.normalize('NFC'))
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;

      return codePoint > 31 && codePoint !== 127 && !INVALID_FILENAME_CHARACTERS.has(character);
    })
    .join('')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/[. ]+$/gu, '');
  const safeTitle = Array.from(normalizedTitle).slice(0, 80).join('') || 'Report';

  return `FastRep - ${safeTitle}.pdf`;
};

export const shareReportOutput = async (
  reportId: string,
  generationId: string,
  title: string,
): Promise<void> => {
  const path = await ensureReportOutputFile(reportId, generationId);

  await Share.open({
    failOnCancel: false,
    filename: getReportOutputShareFileName(title),
    type: 'application/pdf',
    url: `file://${path}`,
    useInternalStorage: true,
  });
};
