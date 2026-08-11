import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { getActiveAppEnvironment } from '@/entities/environment/services/appEnvironmentService';
import { createReportOutputDownloadUrl } from '@/entities/report/API/reportGenerationsApi';

const CACHE_PREFIX = 'FastRep-output-';
const MAX_CACHED_OUTPUTS = 10;
const inFlightDownloads = new Map<string, Promise<string>>();

const downloadOutput = async (reportId: string, cachePath: string): Promise<boolean> => {
  const response = await createReportOutputDownloadUrl(reportId);

  if (response.isError || !response.data) {
    return false;
  }

  const download = await RNFS.downloadFile({ fromUrl: response.data.url, toFile: cachePath }).promise;
  return download.statusCode >= 200 && download.statusCode < 300;
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
      return cachePath;
    }

    let didDownload = await downloadOutput(reportId, cachePath);

    if (!didDownload) {
      if (await RNFS.exists(cachePath)) {
        await RNFS.unlink(cachePath);
      }
      didDownload = await downloadOutput(reportId, cachePath);
    }

    if (!didDownload) {
      if (await RNFS.exists(cachePath)) {
        await RNFS.unlink(cachePath);
      }
      throw new Error('pdf_download_failed');
    }

    await cleanupReportOutputCache();
    return cachePath;
  })().finally(() => inFlightDownloads.delete(cachePath));

  inFlightDownloads.set(cachePath, operation);
  return operation;
};

export const openReportOutput = async (reportId: string, generationId: string): Promise<void> => {
  const path = await ensureReportOutputFile(reportId, generationId);
  await FileViewer.open(path, { showOpenWithDialog: true });
};

export const shareReportOutput = async (
  reportId: string,
  generationId: string,
  title: string,
): Promise<void> => {
  const path = await ensureReportOutputFile(reportId, generationId);
  const safeTitle = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 80) || 'Report';

  await Share.open({
    failOnCancel: false,
    filename: `FastRep - ${safeTitle}.pdf`,
    type: 'application/pdf',
    url: `file://${path}`,
    useInternalStorage: true,
  });
};
