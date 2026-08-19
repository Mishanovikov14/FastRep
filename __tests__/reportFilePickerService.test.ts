import { keepLocalCopy, pick } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import {
  pickReportImages,
  pickReportDocument,
  pickReportImage,
} from '@/entities/report/services/reportFilePickerService';
import { logger } from '@/libs/logger/logger';

jest.mock('@/libs/logger/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const mockPick = pick as unknown as jest.Mock;
const mockKeepLocalCopy = keepLocalCopy as unknown as jest.Mock;
const mockLaunchCamera = launchCamera as unknown as jest.Mock;
const mockLaunchImageLibrary = launchImageLibrary as unknown as jest.Mock;
const mockStat = RNFS.stat as jest.Mock;

describe('report file picker service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStat.mockResolvedValue({ size: 2048 });
  });

  it('uses filesystem metadata when image-picker omits optional size metadata', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      assets: [{ fileName: 'roof.jpg', type: 'image/jpeg', uri: 'file:///cache/roof.jpg' }],
    });

    await expect(pickReportImage('library')).resolves.toMatchObject({
      fileName: 'roof.jpg',
      mimeType: 'image/jpeg',
      ownership: 'SYSTEM_OWNED',
      size: 2048,
      type: 'IMAGE',
      uri: 'file:///cache/roof.jpg',
    });
    expect(mockStat).toHaveBeenCalledWith('/cache/roof.jpg');
    expect(mockLaunchImageLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ assetRepresentationMode: 'compatible', conversionQuality: 0.9 }),
    );
  });

  it('returns multiple gallery selections using the requested dynamic limit', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      assets: [
        { fileName: 'one.jpg', fileSize: 1024, type: 'image/jpeg', uri: 'file:///cache/one.jpg' },
        { fileName: 'two.jpg', fileSize: 1024, type: 'image/jpeg', uri: 'file:///cache/two.jpg' },
        { fileName: 'three.jpg', fileSize: 1024, type: 'image/jpeg', uri: 'file:///cache/three.jpg' },
      ],
    });

    await expect(pickReportImages(13)).resolves.toHaveLength(3);
    expect(mockLaunchImageLibrary).toHaveBeenCalledWith(expect.objectContaining({ selectionLimit: 13 }));
    expect(logger.info).toHaveBeenCalledWith(
      'report.multi_photo_batch_selected',
      expect.objectContaining({ assetCount: 3, assetType: 'IMAGE' }),
    );
  });

  it('generates a safe image filename and resolves MIME from the URI when metadata is missing', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      assets: [{ fileSize: 1024, uri: 'file:///cache/selected-image.png' }],
    });

    await expect(pickReportImage('library')).resolves.toMatchObject({
      fileName: expect.stringMatching(/^photo-\d+\.png$/u),
      mimeType: 'image/png',
      size: 2048,
      type: 'IMAGE',
    });
  });

  it('returns silently when image selection is cancelled and surfaces picker errors', async () => {
    mockLaunchCamera
      .mockResolvedValueOnce({ didCancel: true })
      .mockResolvedValueOnce({ errorCode: 'camera_unavailable' });

    await expect(pickReportImage('camera')).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
    await expect(pickReportImage('camera')).rejects.toMatchObject({ code: 'IMAGE_PICKER_FAILED' });
  });

  it('normalizes the actual Android camera result shape into a readable candidate', async () => {
    mockLaunchCamera.mockResolvedValue({
      assets: [
        {
          fileName: 'rn_image_picker_lib_temp_42.jpg',
          fileSize: 179915,
          height: 1080,
          type: 'image/jpeg',
          uri: 'file:///data/user/0/com.fastrep/cache/rn_image_picker_lib_temp_42.jpg',
          width: 1080,
        },
      ],
    });
    mockStat.mockResolvedValue({ size: 179915 });

    await expect(pickReportImage('camera')).resolves.toMatchObject({
      height: 1080,
      mimeType: 'image/jpeg',
      ownership: 'SYSTEM_OWNED',
      size: 179915,
      type: 'IMAGE',
      width: 1080,
    });
  });

  it('rejects HEIC when the native compatible conversion does not return JPEG bytes', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      assets: [{ fileName: 'roof.heic', fileSize: 4096, type: 'image/heic', uri: 'file:///cache/roof.heic' }],
    });

    await expect(pickReportImage('library')).rejects.toMatchObject({ code: 'IMAGE_HEIC_CONVERSION_FAILED' });
  });

  it('uses the converted JPEG extension when Android preserves the original HEIC display name', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      assets: [{ fileName: 'roof.heic', fileSize: 4096, type: 'image/jpeg', uri: 'file:///cache/converted.jpg' }],
    });

    await expect(pickReportImage('library')).resolves.toMatchObject({
      fileName: 'roof.jpg',
      mimeType: 'image/jpeg',
      uri: 'file:///cache/converted.jpg',
    });
  });

  it('copies a picked document to cache and stats the uploadable local file', async () => {
    mockPick.mockResolvedValue([
      {
        error: null,
        hasRequestedType: true,
        name: 'inspection.pdf',
        size: null,
        type: 'application/pdf',
        uri: 'content://provider/inspection',
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      { localUri: 'file:///cache/inspection.pdf', sourceUri: 'content://provider/inspection', status: 'success' },
    ]);
    mockStat.mockResolvedValue({ size: 8192 });

    await expect(pickReportDocument()).resolves.toEqual({
      displayName: 'inspection.pdf',
      fileName: 'inspection.pdf',
      mimeType: 'application/pdf',
      ownership: 'APP_TEMPORARY',
      size: 8192,
      type: 'DOCUMENT',
      uri: 'file:///cache/inspection.pdf',
    });
    expect(mockKeepLocalCopy).toHaveBeenCalledWith({
      destination: 'cachesDirectory',
      files: [{ fileName: 'inspection.pdf', uri: 'content://provider/inspection' }],
    });
  });

  it('preserves the original user-facing document name and MIME type', async () => {
    mockPick.mockResolvedValue([
      {
        error: null,
        hasRequestedType: true,
        name: 'Invoice August 2026.xlsx',
        size: 4096,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uri: 'content://provider/invoice',
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      {
        localUri: 'file:///cache/Invoice-August-2026.xlsx',
        sourceUri: 'content://provider/invoice',
        status: 'success',
      },
    ]);

    await expect(pickReportDocument()).resolves.toMatchObject({
      displayName: 'Invoice August 2026.xlsx',
      fileName: 'Invoice-August-2026.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uri: 'file:///cache/Invoice-August-2026.xlsx',
    });
  });

  it('exports an Android virtual document to a supported local file type', async () => {
    mockPick.mockResolvedValue([
      {
        convertibleToMimeTypes: [
          { extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        ],
        error: null,
        hasRequestedType: true,
        isVirtual: true,
        name: 'Inspection sheet',
        type: 'application/vnd.google-apps.spreadsheet',
        uri: 'content://provider/virtual-sheet',
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      {
        localUri: 'file:///cache/Inspection-sheet.xlsx',
        sourceUri: 'content://provider/virtual-sheet',
        status: 'success',
      },
    ]);

    await expect(pickReportDocument()).resolves.toMatchObject({
      displayName: 'Inspection sheet',
      fileName: 'Inspection-sheet.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(mockKeepLocalCopy).toHaveBeenCalledWith({
      destination: 'cachesDirectory',
      files: [
        {
          convertVirtualFileToType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileName: 'Inspection-sheet.xlsx',
          uri: 'content://provider/virtual-sheet',
        },
      ],
    });
  });

  it('resolves an exact supported document MIME when a provider returns octet-stream', async () => {
    mockPick.mockResolvedValue([
      {
        error: null,
        hasRequestedType: true,
        name: 'inspection.docx',
        type: 'application/octet-stream',
        uri: 'content://provider/inspection',
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      { localUri: 'file:///cache/inspection.docx', sourceUri: 'content://provider/inspection', status: 'success' },
    ]);

    await expect(pickReportDocument()).resolves.toMatchObject({
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 2048,
    });
  });

  it('rejects unsupported document types before copying them', async () => {
    mockPick.mockResolvedValue([
      {
        error: null,
        hasRequestedType: false,
        name: 'legacy.doc',
        type: 'application/msword',
        uri: 'content://provider/legacy',
      },
    ]);

    await expect(pickReportDocument()).rejects.toMatchObject({ code: 'DOCUMENT_UNSUPPORTED_TYPE' });
    expect(mockKeepLocalCopy).not.toHaveBeenCalled();
  });

  it('treats only the document-picker cancellation code as a silent cancellation', async () => {
    mockPick.mockRejectedValueOnce({ code: 'OPERATION_CANCELED' }).mockRejectedValueOnce({ code: 'IN_PROGRESS' });

    await expect(pickReportDocument()).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
    await expect(pickReportDocument()).rejects.toMatchObject({ code: 'DOCUMENT_PICKER_FAILED' });
  });

  it('surfaces local-copy failures', async () => {
    mockPick.mockResolvedValue([
      {
        error: null,
        hasRequestedType: true,
        name: 'inspection.pdf',
        type: 'application/pdf',
        uri: 'content://provider/inspection',
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      { copyError: 'provider unavailable', sourceUri: 'content://provider/inspection', status: 'error' },
    ]);

    await expect(pickReportDocument()).rejects.toMatchObject({ code: 'DOCUMENT_COPY_FAILED' });
  });

  it('removes a copied document when its filesystem metadata cannot be read', async () => {
    mockPick.mockResolvedValue([
      {
        error: null,
        hasRequestedType: true,
        name: 'inspection.pdf',
        type: 'application/pdf',
        uri: 'content://provider/inspection',
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      { localUri: 'file:///cache/inspection.pdf', sourceUri: 'content://provider/inspection', status: 'success' },
    ]);
    mockStat.mockRejectedValue(new Error('stat failed'));
    (RNFS.exists as jest.Mock).mockResolvedValue(true);

    await expect(pickReportDocument()).rejects.toMatchObject({ code: 'DOCUMENT_FILE_UNREADABLE' });
    expect(RNFS.unlink).toHaveBeenCalledWith('/cache/inspection.pdf');
  });
});
