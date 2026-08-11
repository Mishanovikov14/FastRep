import {
  confirmReportAssetUpload,
  deleteReportAsset,
  getReportAssets,
  requestReportAssetUpload,
} from '@/entities/report/API/reportAssetsApi';
import { requester } from '@/libs/requester/requester';

jest.mock('@/libs/requester/requester', () => ({ requester: { request: jest.fn() } }));

describe('report assets API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requester.request).mockResolvedValue({ isError: false, message: '' });
  });

  it('requests an upload contract, confirms, lists and removes assets', async () => {
    const payload = { fileName: 'photo.jpg', mimeType: 'image/jpeg', size: 123, type: 'IMAGE' as const };
    await requestReportAssetUpload('report-1', payload);
    await confirmReportAssetUpload('report-1', 'asset-1');
    await getReportAssets('report-1');
    await deleteReportAsset('report-1', 'asset-1');

    expect(requester.request).toHaveBeenNthCalledWith(1, {
      data: payload,
      method: 'POST',
      url: '/reports/report-1/assets/upload-request',
    });
    expect(jest.mocked(requester.request).mock.calls.slice(1).map(([request]) => request)).toEqual([
      { method: 'POST', url: '/reports/report-1/assets/asset-1/confirm' },
      { method: 'GET', url: '/reports/report-1/assets' },
      { method: 'DELETE', url: '/reports/report-1/assets/asset-1' },
    ]);
  });
});
