import RNFS from 'react-native-fs';

import type { ReportAssetFileOwnership } from '@/entities/report/types/reportAsset';

export type ReportLocalFileErrorCode = 'FILE_UNREADABLE' | 'URI_UNSUPPORTED';

export class ReportLocalFileError extends Error {
  constructor(public readonly code: ReportLocalFileErrorCode) {
    super(code);
    this.name = 'ReportLocalFileError';
  }
}

const decodeFileUriPath = (path: string): string => {
  try {
    return decodeURIComponent(path);
  } catch {
    throw new ReportLocalFileError('URI_UNSUPPORTED');
  }
};

export const normalizeLocalFilePath = (uri: string): string => {
  if (uri.startsWith('file://')) {
    const path = decodeFileUriPath(uri.slice('file://'.length));

    if (!path.startsWith('/')) {
      throw new ReportLocalFileError('URI_UNSUPPORTED');
    }

    return path;
  }

  if (uri.startsWith('/')) {
    return uri;
  }

  throw new ReportLocalFileError('URI_UNSUPPORTED');
};

export const getReadableLocalFileSize = async (uri: string): Promise<number> => {
  const path = normalizeLocalFilePath(uri);
  let stat;

  try {
    stat = await RNFS.stat(path);
  } catch {
    throw new ReportLocalFileError('FILE_UNREADABLE');
  }

  const size = Number(stat.size);

  if (!Number.isFinite(size) || size <= 0) {
    throw new ReportLocalFileError('FILE_UNREADABLE');
  }

  return size;
};

export const cleanupOwnedLocalFile = async (uri: string, ownership: ReportAssetFileOwnership): Promise<boolean> => {
  if (ownership !== 'APP_TEMPORARY') {
    return false;
  }

  const path = normalizeLocalFilePath(uri);

  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
    return true;
  }

  return false;
};
