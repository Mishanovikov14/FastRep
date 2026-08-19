import type { IPresignedPostContract } from '@/entities/report/types/reportAsset';

export type ReportStorageUploadFailureType = 'http_error' | 'network_error' | 'timeout_error';

export class ReportStorageUploadError extends Error {
  constructor(
    public readonly failureType: ReportStorageUploadFailureType,
    public readonly httpStatus?: number,
  ) {
    super(failureType);
    this.name = 'ReportStorageUploadError';
  }
}

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
    request.open(contract.method, contract.url);
    request.upload.onprogress = ({ lengthComputable, loaded, total }) => {
      if (lengthComputable && total > 0) {
        const progress = Math.round((loaded / total) * 100);
        onProgress(progress);
      }
    };
    request.onerror = () => {
      reject(new ReportStorageUploadError('network_error'));
    };
    request.ontimeout = () => {
      reject(new ReportStorageUploadError('timeout_error'));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new ReportStorageUploadError('http_error', request.status));
      }
    };
    request.timeout = 120_000;
    request.send(formData);
  });
};
