import type { IPresignedPostContract } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';

interface IUploadInput {
  contract: IPresignedPostContract;
  fileName: string;
  mimeType: string;
  onProgress(progress: number): void;
  uri: string;
}

export const uploadReportAssetToStorage = ({
  contract,
  fileName,
  mimeType,
  onProgress,
  uri,
}: IUploadInput): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.info('report.asset_upload_started', {
      mimeType,
      operation: 'presigned_post',
      uriScheme: uri.match(/^([a-z][a-z0-9+.-]*):/iu)?.[1]?.toLowerCase() ?? 'path',
    });
    const formData = new FormData();

    Object.entries(contract.fields).forEach(([key, value]) => formData.append(key, value));
    formData.append(
      'file',
      {
        name: fileName,
        type: mimeType,
        uri,
      } as unknown as Blob,
    );

    const request = new XMLHttpRequest();
    let lastLoggedProgress = 0;
    request.open(contract.method, contract.url);
    request.upload.onprogress = ({ lengthComputable, loaded, total }) => {
      if (lengthComputable && total > 0) {
        const progress = Math.round((loaded / total) * 100);
        onProgress(progress);
        if (progress >= lastLoggedProgress + 25 && progress < 100) {
          lastLoggedProgress = progress;
          logger.debug('report.asset_upload_progress', { mimeType, progress });
        }
      }
    };
    request.onerror = () => {
      logger.error('report.asset_upload_failed', { errorCode: 'network_error', mimeType });
      reject(new Error('presigned_upload_failed'));
    };
    request.ontimeout = () => {
      logger.error('report.asset_upload_failed', { errorCode: 'timeout_error', mimeType });
      reject(new Error('presigned_upload_timeout'));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        logger.info('report.asset_upload_completed', { httpStatus: request.status, mimeType, progress: 100 });
        resolve();
      } else {
        logger.error('report.asset_upload_failed', { httpStatus: request.status, mimeType });
        reject(new Error(`presigned_upload_status_${request.status}`));
      }
    };
    request.timeout = 120_000;
    request.send(formData);
  });
};
