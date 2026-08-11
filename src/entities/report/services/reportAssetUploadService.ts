import type { IPresignedPostContract } from '@/entities/report/types/reportAsset';

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
        onProgress(Math.round((loaded / total) * 100));
      }
    };
    request.onerror = () => reject(new Error('presigned_upload_failed'));
    request.ontimeout = () => reject(new Error('presigned_upload_timeout'));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`presigned_upload_status_${request.status}`));
      }
    };
    request.timeout = 120_000;
    request.send(formData);
  });
};
