import type {
  IReportAsset,
  IReportAssetUploadRequest,
  IRequestReportAssetUpload,
} from '@/entities/report/types/reportAsset';
import type { IResponse } from '@/libs/requester/IResponse';
import { requester } from '@/libs/requester/requester';

export const requestReportAssetUpload = (
  reportId: string,
  request: IRequestReportAssetUpload,
): Promise<IResponse<IReportAssetUploadRequest>> => {
  return requester.request<IReportAssetUploadRequest>({
    data: request,
    method: 'POST',
    url: `/reports/${reportId}/assets/upload-request`,
  });
};

export const confirmReportAssetUpload = (reportId: string, assetId: string): Promise<IResponse<IReportAsset>> => {
  return requester.request<IReportAsset>({
    method: 'POST',
    url: `/reports/${reportId}/assets/${assetId}/confirm`,
  });
};

export const getReportAssets = (reportId: string): Promise<IResponse<IReportAsset[]>> => {
  return requester.request<IReportAsset[]>({ method: 'GET', url: `/reports/${reportId}/assets` });
};

export const deleteReportAsset = (reportId: string, assetId: string): Promise<IResponse<void>> => {
  return requester.request<void>({ method: 'DELETE', url: `/reports/${reportId}/assets/${assetId}` });
};
