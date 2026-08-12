import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

import { createReportAssetDownloadUrl } from '@/entities/report/API/reportAssetsApi';
import {
  ensureReportAssetFile,
  openReportDocumentAsset,
  ReportAssetAccessError,
} from '@/entities/report/services/reportAssetAccessService';
import type { IReportAsset } from '@/entities/report/types/reportAsset';

jest.mock('@/entities/environment/services/appEnvironmentService', () => ({
  getActiveAppEnvironment: () => ({ key: 'development' }),
}));
jest.mock('@/entities/report/API/reportAssetsApi', () => ({ createReportAssetDownloadUrl: jest.fn() }));

const asset: IReportAsset = {
  createdAt: '2026-08-11T10:00:00.000Z',
  declaredMimeType: 'application/pdf',
  declaredSize: 2048,
  id: 'document-1',
  originalFileName: 'inspection.pdf',
  position: 0,
  reportId: 'report-1',
  status: 'READY',
  type: 'DOCUMENT',
  updatedAt: '2026-08-11T10:00:00.000Z',
};

describe('report asset access service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(RNFS.exists).mockResolvedValue(false);
    jest.mocked(RNFS.readDir).mockResolvedValue([]);
    jest.mocked(RNFS.unlink).mockResolvedValue();
    jest.mocked(createReportAssetDownloadUrl).mockResolvedValue({
      data: { expiresAt: '2026-08-11T10:05:00.000Z', url: 'https://signed.example/one' },
      isError: false,
      message: '',
    });
    jest.mocked(RNFS.downloadFile).mockReturnValue({
      jobId: 1,
      promise: Promise.resolve({ bytesWritten: 2048, jobId: 1, statusCode: 200 }),
    });
  });

  it('requests a fresh URL when the first download URL has expired', async () => {
    jest
      .mocked(createReportAssetDownloadUrl)
      .mockResolvedValueOnce({
        data: { expiresAt: '2026-08-11T10:00:00.000Z', url: 'https://signed.example/expired' },
        isError: false,
        message: '',
      })
      .mockResolvedValueOnce({
        data: { expiresAt: '2026-08-11T10:05:00.000Z', url: 'https://signed.example/fresh' },
        isError: false,
        message: '',
      });
    jest
      .mocked(RNFS.downloadFile)
      .mockReturnValueOnce({
        jobId: 1,
        promise: Promise.resolve({ bytesWritten: 0, jobId: 1, statusCode: 403 }),
      })
      .mockReturnValueOnce({
        jobId: 2,
        promise: Promise.resolve({ bytesWritten: 2048, jobId: 2, statusCode: 200 }),
      });

    await expect(ensureReportAssetFile('report-1', asset)).resolves.toContain('document-1.pdf');
    expect(createReportAssetDownloadUrl).toHaveBeenCalledTimes(2);
    expect(RNFS.downloadFile).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ fromUrl: 'https://signed.example/fresh' }),
    );
  });

  it('opens the downloaded local document', async () => {
    await openReportDocumentAsset('report-1', { ...asset, id: 'document-2' });

    expect(FileViewer.open).toHaveBeenCalledWith(expect.stringContaining('document-2.pdf'), {
      showOpenWithDialog: true,
    });
  });

  it.each([
    ['application/pdf', 'pdf'],
    ['text/plain', 'txt'],
    ['text/csv', 'csv'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  ])('opens supported %s documents from the environment/report/asset cache key', async (mimeType, extension) => {
    const document = {
      ...asset,
      declaredMimeType: mimeType,
      id: `document-${extension}`,
      originalFileName: `inspection.${extension}`,
    };

    await openReportDocumentAsset('report-cache-key', document);

    expect(RNFS.downloadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        toFile: expect.stringContaining(
          `FastRep-asset-development-report-cache-key-document-${extension}.${extension}`,
        ),
      }),
    );
    expect(FileViewer.open).toHaveBeenCalledWith(expect.stringContaining(`document-${extension}.${extension}`), {
      showOpenWithDialog: true,
    });
  });

  it('returns a stable friendly error when the OS has no viewer', async () => {
    jest.mocked(FileViewer.open).mockRejectedValueOnce(new Error('unsupported'));

    await expect(openReportDocumentAsset('report-1', { ...asset, id: 'document-3' })).rejects.toEqual(
      expect.objectContaining<Partial<ReportAssetAccessError>>({ code: 'ASSET_VIEWER_UNAVAILABLE' }),
    );
  });
});
