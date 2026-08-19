import { viewDocument } from '@react-native-documents/viewer';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { createReportOutputDownloadUrl } from '@/entities/report/API/reportGenerationsApi';
import {
  openReportOutput,
  ReportOutputAccessError,
  shareReportOutput,
} from '@/entities/report/services/reportOutputService';

jest.mock('@/entities/environment/services/appEnvironmentService', () => ({
  getActiveAppEnvironment: () => ({ key: 'development' }),
}));
jest.mock('@/entities/report/API/reportGenerationsApi', () => ({ createReportOutputDownloadUrl: jest.fn() }));

describe('report output service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(RNFS.exists).mockResolvedValue(true).mockResolvedValueOnce(false);
    jest.mocked(RNFS.readDir).mockResolvedValue([]);
    jest.mocked(RNFS.stat).mockResolvedValue({ size: 4096 } as never);
    jest.mocked(RNFS.unlink).mockResolvedValue();
    jest.mocked(createReportOutputDownloadUrl).mockResolvedValue({
      data: { expiresAt: '2026-08-19T12:05:00.000Z', url: 'https://signed.example/report' },
      isError: false,
      message: '',
    });
    jest.mocked(RNFS.downloadFile).mockReturnValue({
      jobId: 1,
      promise: Promise.resolve({ bytesWritten: 4096, jobId: 1, statusCode: 200 }),
    });
  });

  it('opens the generated PDF through the shared local document viewer', async () => {
    await openReportOutput('report-open', 'generation-open');

    expect(viewDocument).toHaveBeenCalledWith({
      grantPermissions: 'read',
      headerTitle: undefined,
      mimeType: 'application/pdf',
      uri: 'file:///cache/FastRep-output-development-report-open-generation-open.pdf',
    });
  });

  it('keeps generated PDF sharing on the existing native share flow', async () => {
    await shareReportOutput('report-share', 'generation-share', 'Roof review');

    expect(Share.open).toHaveBeenCalledWith({
      failOnCancel: false,
      filename: 'FastRep - Roof review.pdf',
      type: 'application/pdf',
      url: 'file:///cache/FastRep-output-development-report-share-generation-share.pdf',
      useInternalStorage: true,
    });
    expect(viewDocument).not.toHaveBeenCalled();
  });

  it('does not invoke the viewer when a generated PDF download remains empty', async () => {
    jest.mocked(RNFS.stat).mockResolvedValue({ size: 0 } as never);

    await expect(openReportOutput('report-empty', 'generation-empty')).rejects.toEqual(
      expect.objectContaining<Partial<ReportOutputAccessError>>({ code: 'OUTPUT_DOWNLOAD_FAILED' }),
    );
    expect(RNFS.downloadFile).toHaveBeenCalledTimes(2);
    expect(viewDocument).not.toHaveBeenCalled();
  });
});
