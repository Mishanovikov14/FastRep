import { viewDocument } from '@react-native-documents/viewer';
import RNFS from 'react-native-fs';

import {
  openLocalReportDocument,
  ReportDocumentViewerError,
} from '@/entities/report/services/reportDocumentViewerService';

describe('report document viewer service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(RNFS.exists).mockResolvedValue(true);
    jest.mocked(RNFS.stat).mockResolvedValue({ size: 2048 } as never);
  });

  it.each([
    ['application/pdf', 'pdf'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
    ['text/csv', 'csv'],
    ['text/plain', 'txt'],
  ])('opens a validated %s local file with an explicit MIME type', async (mimeType, extension) => {
    await openLocalReportDocument({ mimeType, path: `/cache/document.${extension}` });

    expect(viewDocument).toHaveBeenCalledWith({
      grantPermissions: 'read',
      headerTitle: undefined,
      mimeType,
      uri: `file:///cache/document.${extension}`,
    });
  });

  it.each([
    [false, 2048, 'LOCAL_FILE_MISSING'],
    [true, 0, 'LOCAL_FILE_EMPTY'],
  ])('does not reach the viewer when exists=%s and size=%s', async (exists, size, code) => {
    jest.mocked(RNFS.exists).mockResolvedValue(exists);
    jest.mocked(RNFS.stat).mockResolvedValue({ size } as never);

    await expect(
      openLocalReportDocument({ mimeType: 'application/pdf', path: '/cache/document.pdf' }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ReportDocumentViewerError>>({
        code: code as 'LOCAL_FILE_EMPTY' | 'LOCAL_FILE_MISSING',
      }),
    );
    expect(viewDocument).not.toHaveBeenCalled();
  });

  it('rejects a MIME/extension mismatch before viewer invocation', async () => {
    await expect(
      openLocalReportDocument({ mimeType: 'application/pdf', path: '/cache/document.txt' }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ReportDocumentViewerError>>({ code: 'LOCAL_FILE_EXTENSION_MISMATCH' }),
    );
    expect(viewDocument).not.toHaveBeenCalled();
  });
});
