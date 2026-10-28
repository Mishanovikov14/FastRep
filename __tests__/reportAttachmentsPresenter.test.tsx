import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { v4 as uuidv4 } from 'uuid';

import {
  confirmReportAssetUpload,
  deleteReportAsset,
  requestReportAssetUpload,
} from '@/entities/report/API/reportAssetsApi';
import { ReportAttachmentError } from '@/entities/report/model/ReportAttachmentError';
import { uploadReportAssetToStorage } from '@/entities/report/services/reportAssetUploadService';
import {
  normalizeReportImageSelection,
  pickReportDocument,
  pickReportImage,
  pickReportImages,
} from '@/entities/report/services/reportFilePickerService';
import {
  requestMicrophonePermission,
  startReportAudioRecording,
} from '@/entities/report/services/reportAudioRecordingService';
import type { IReportAsset } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';
import { queryClient } from '@/libs/query/QueryClient';
import { toastService } from '@/libs/toast/toastService';
import { useDeleteReportAssetMutation, useReportAssetsQuery } from '@/modules/reports/presenters/reportAssetQueries';
import { useReportAttachmentsPresenter } from '@/modules/reports/ui/ReportDetailsView/presenters/useReportAttachmentsPresenter';

jest.mock('@/entities/report/API/reportAssetsApi', () => ({
  confirmReportAssetUpload: jest.fn(),
  deleteReportAsset: jest.fn(),
  requestReportAssetUpload: jest.fn(),
}));
jest.mock('@/entities/report/services/reportAssetUploadService', () => {
  class ReportStorageUploadError extends Error {}

  return { ReportStorageUploadError, uploadReportAssetToStorage: jest.fn() };
});
jest.mock('@/entities/report/services/reportAudioRecordingService', () => ({
  cancelReportAudioRecording: jest.fn(),
  requestMicrophonePermission: jest.fn(),
  startReportAudioRecording: jest.fn(),
  stopReportAudioRecording: jest.fn(),
}));
jest.mock('@/entities/report/services/reportFilePickerService', () => ({
  normalizeReportImageSelection: jest.fn(),
  pickReportDocument: jest.fn(),
  pickReportImage: jest.fn(),
  pickReportImages: jest.fn(),
}));
jest.mock('@/libs/logger/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
jest.mock('@/libs/query/QueryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(), setQueryData: jest.fn() },
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: { showError: jest.fn() },
}));
jest.mock('@/modules/reports/presenters/reportAssetQueries', () => ({
  useDeleteReportAssetMutation: jest.fn(),
  useReportAssetsQuery: jest.fn(),
}));

const t = ((key: string) => key) as unknown as TFunction;
const uuidV4Mock = uuidv4 as unknown as jest.MockedFunction<() => string>;
const confirmedAsset: IReportAsset = {
  createdAt: '2026-08-11T10:00:00.000Z',
  declaredMimeType: 'image/jpeg',
  declaredSize: 1024,
  id: 'asset-1',
  originalFileName: 'roof.jpg',
  position: 0,
  reportId: 'report-1',
  status: 'READY',
  type: 'IMAGE',
  updatedAt: '2026-08-11T10:00:00.000Z',
};

const flushPromises = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
};

describe('report attachments presenter upload state machine', () => {
  let presenter: ReturnType<typeof useReportAttachmentsPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  let canEdit: boolean;

  const Harness = () => {
    presenter = useReportAttachmentsPresenter({ canEdit, reportId: 'report-1', t });
    return null;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    canEdit = true;
    let uuidIndex = 0;
    uuidV4Mock.mockImplementation(() => `00000000-0000-4000-8000-${String(uuidIndex++).padStart(12, '0')}`);
    jest.mocked(useReportAssetsQuery).mockReset();
    jest.mocked(useDeleteReportAssetMutation).mockReset();
    jest.mocked(pickReportImage).mockReset();
    jest.mocked(pickReportImages).mockReset();
    jest.mocked(normalizeReportImageSelection).mockReset();
    jest.mocked(requestReportAssetUpload).mockReset();
    jest.mocked(uploadReportAssetToStorage).mockReset();
    jest.mocked(deleteReportAsset).mockReset();
    jest.mocked(confirmReportAssetUpload).mockReset();
    jest.mocked(queryClient.invalidateQueries).mockReset();
    jest.mocked(queryClient.setQueryData).mockReset();
    jest.mocked(useReportAssetsQuery).mockReturnValue({ data: [], isPending: false } as never);
    jest.mocked(useDeleteReportAssetMutation).mockReturnValue({ mutateAsync: jest.fn() } as never);
    jest.mocked(pickReportImage).mockResolvedValue({
      fileName: 'roof.jpg',
      mimeType: 'image/jpeg',
      ownership: 'SYSTEM_OWNED',
      size: 1024,
      type: 'IMAGE',
      uri: 'file:///cache/roof.jpg',
    });
    jest.mocked(pickReportImages).mockResolvedValue([
      {
        fileName: 'roof.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        uri: 'file:///cache/roof.jpg',
      },
    ]);
    jest.mocked(normalizeReportImageSelection).mockResolvedValue({
      fileName: 'roof.jpg',
      mimeType: 'image/jpeg',
      ownership: 'SYSTEM_OWNED',
      size: 1024,
      type: 'IMAGE',
      uri: 'file:///cache/roof.jpg',
    });
    jest.mocked(requestReportAssetUpload).mockResolvedValue({
      data: {
        assetId: 'asset-1',
        expiresAt: '2025-08-11T10:00:00.000Z',
        upload: { fields: { key: 'private/key' }, method: 'POST', url: 'https://storage.test' },
      },
      isError: false,
      message: '',
    });
    jest.mocked(uploadReportAssetToStorage).mockResolvedValue(undefined);
    jest.mocked(deleteReportAsset).mockResolvedValue({ isError: false, message: '', status: 204 });
    jest
      .mocked(confirmReportAssetUpload)
      .mockResolvedValueOnce({ isError: true, message: 'confirm failed', status: 503 })
      .mockResolvedValueOnce({ data: confirmedAsset, isError: false, message: '' });
    jest.mocked(queryClient.invalidateQueries).mockResolvedValue(undefined);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => renderer?.unmount());
  });

  it('retries confirmation without uploading the same binary or accepting duplicate retry taps', async () => {
    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await flushPromises();
    });

    expect(presenter?.localAssets[0]).toMatchObject({ errorCode: 'IMAGE_CONFIRM_FAILED', status: 'FAILED' });
    const localAssetId = presenter?.localAssets[0]?.id as string;

    await ReactTestRenderer.act(async () => {
      presenter?.onRetryUpload(localAssetId);
      presenter?.onRetryUpload(localAssetId);
      await flushPromises();
    });

    expect(requestReportAssetUpload).toHaveBeenCalledTimes(1);
    expect(uploadReportAssetToStorage).toHaveBeenCalledTimes(1);
    expect(confirmReportAssetUpload).toHaveBeenCalledTimes(2);
    expect(toastService.showError).toHaveBeenCalledWith(
      'reports.attachments.confirmFailed',
      'reports.attachments.tryAgain\nIMAGE_CONFIRM_FAILED',
    );
    expect(
      jest
        .mocked(logger.debug)
        .mock.calls.filter(([event]) => event === 'report.attachment_stage')
        .map(([, metadata]) => metadata?.stage),
    ).toEqual([
      'UPLOAD_REQUEST_STARTED',
      'UPLOAD_REQUEST_SUCCEEDED',
      'STORAGE_UPLOAD_STARTED',
      'STORAGE_UPLOAD_SUCCEEDED',
      'CONFIRM_STARTED',
      'CONFIRM_STARTED',
      'CONFIRM_SUCCEEDED',
      'READY',
    ]);
    expect(presenter?.localAssets).toEqual([]);
    expect(queryClient.setQueryData).toHaveBeenCalledTimes(1);
  });

  it('does not invoke add attachment handlers when source editing becomes blocked', async () => {
    ReactTestRenderer.act(() => renderer?.unmount());
    canEdit = false;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await presenter?.onTakePhoto();
      await presenter?.onAddDocument();
      await presenter?.onStartRecording();
    });

    expect(pickReportImages).not.toHaveBeenCalled();
    expect(pickReportImage).not.toHaveBeenCalled();
    expect(pickReportDocument).not.toHaveBeenCalled();
    expect(requestMicrophonePermission).not.toHaveBeenCalled();
    expect(startReportAudioRecording).not.toHaveBeenCalled();
  });

  it('cleans an expired pending slot before requesting a new upload contract', async () => {
    jest.mocked(uploadReportAssetToStorage).mockRejectedValueOnce(new Error('storage unavailable'));
    jest
      .mocked(requestReportAssetUpload)
      .mockResolvedValueOnce({
        data: {
          assetId: 'expired-asset',
          expiresAt: '2025-08-11T10:00:00.000Z',
          upload: { fields: { key: 'expired/key' }, method: 'POST', url: 'https://storage.test' },
        },
        isError: false,
        message: '',
      })
      .mockResolvedValueOnce({
        data: {
          assetId: 'replacement-asset',
          expiresAt: '2099-08-11T10:00:00.000Z',
          upload: { fields: { key: 'replacement/key' }, method: 'POST', url: 'https://storage.test' },
        },
        isError: false,
        message: '',
      });
    jest.mocked(confirmReportAssetUpload).mockReset().mockResolvedValue({
      data: confirmedAsset,
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await flushPromises();
    });

    const localAssetId = presenter?.localAssets[0]?.id as string;
    expect(presenter?.localAssets[0]).toMatchObject({ errorCode: 'IMAGE_STORAGE_UPLOAD_FAILED', status: 'FAILED' });

    await ReactTestRenderer.act(async () => {
      presenter?.onRetryUpload(localAssetId);
      await flushPromises();
    });

    expect(deleteReportAsset).toHaveBeenCalledWith('report-1', 'expired-asset');
    expect(requestReportAssetUpload).toHaveBeenCalledTimes(2);
    expect(uploadReportAssetToStorage).toHaveBeenCalledTimes(2);
    expect(confirmReportAssetUpload).toHaveBeenCalledWith('report-1', 'replacement-asset');
    expect(presenter?.localAssets).toEqual([]);
  });

  it('classifies local validation with the deterministic image error code', async () => {
    jest.mocked(normalizeReportImageSelection).mockResolvedValue({
      fileName: 'oversized.jpg',
      mimeType: 'image/jpeg',
      ownership: 'SYSTEM_OWNED',
      size: 11 * 1024 * 1024,
      type: 'IMAGE',
      uri: 'file:///cache/oversized.jpg',
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await flushPromises();
    });

    expect(requestReportAssetUpload).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'report.multi_photo_item_upload_failed',
      expect.objectContaining({ assetType: 'IMAGE', errorCode: 'fileTooLarge', stage: 'VALIDATING' }),
    );
  });

  it('uses the remaining image capacity and ignores rejected server images', async () => {
    const readyImages = Array.from({ length: 18 }, (_, index) => ({
      ...confirmedAsset,
      id: `ready-${index}`,
      position: index,
    }));
    jest.mocked(useReportAssetsQuery).mockReturnValue({
      data: [...readyImages, { ...confirmedAsset, id: 'rejected', position: 18, status: 'REJECTED' }],
      isPending: false,
    } as never);
    jest.mocked(pickReportImages).mockResolvedValue(undefined);

    await ReactTestRenderer.act(async () => {
      renderer?.update(<Harness />);
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
    });

    expect(pickReportImages).toHaveBeenCalledWith(2);
  });

  it('uploads a selected photo batch with at most three active uploads', async () => {
    const selections = Array.from({ length: 5 }, (_, index) => ({
      fileName: `roof-${index}.jpg`,
      fileSize: 1024,
      mimeType: 'image/jpeg',
      uri: `file:///cache/roof-${index}.jpg`,
    }));
    jest.mocked(pickReportImages).mockResolvedValue(selections);
    jest.mocked(normalizeReportImageSelection).mockImplementation(async (selection) => ({
      fileName: selection.fileName as string,
      mimeType: 'image/jpeg',
      ownership: 'SYSTEM_OWNED',
      size: 1024,
      type: 'IMAGE',
      uri: selection.uri as string,
    }));
    let requestIndex = 0;
    jest.mocked(requestReportAssetUpload).mockImplementation(async () => ({
      data: {
        assetId: `asset-${requestIndex++}`,
        expiresAt: '2099-08-11T10:00:00.000Z',
        upload: { fields: {}, method: 'POST', url: 'https://storage.test' },
      },
      isError: false,
      message: '',
    }));
    jest.mocked(confirmReportAssetUpload).mockReset().mockResolvedValue({
      data: confirmedAsset,
      isError: false,
      message: '',
    });
    let activeUploads = 0;
    let maxActiveUploads = 0;
    const uploadResolvers: Array<() => void> = [];
    jest.mocked(uploadReportAssetToStorage).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          activeUploads += 1;
          maxActiveUploads = Math.max(maxActiveUploads, activeUploads);
          uploadResolvers.push(() => {
            activeUploads -= 1;
            resolve();
          });
        }),
    );

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await flushPromises();
    });
    expect(uploadResolvers).toHaveLength(3);
    expect(presenter?.localAssets).toHaveLength(5);

    for (let index = 0; index < 5; index += 1) {
      await ReactTestRenderer.act(async () => {
        uploadResolvers[index]?.();
        await flushPromises();
      });
    }

    expect(maxActiveUploads).toBe(3);
    expect(uploadReportAssetToStorage).toHaveBeenCalledTimes(5);
  });

  it('isolates an HEIC normalization failure and continues the other photo', async () => {
    jest.mocked(pickReportImages).mockResolvedValue([
      { fileName: 'bad.heic', fileSize: 1024, mimeType: 'image/heic', uri: 'file:///cache/bad.heic' },
      { fileName: 'good.jpg', fileSize: 1024, mimeType: 'image/jpeg', uri: 'file:///cache/good.jpg' },
    ]);
    jest
      .mocked(normalizeReportImageSelection)
      .mockRejectedValueOnce(new ReportAttachmentError('IMAGE', 'IMAGE_HEIC_CONVERSION_FAILED', 'METADATA_NORMALIZING'))
      .mockResolvedValueOnce({
        fileName: 'good.jpg',
        mimeType: 'image/jpeg',
        ownership: 'SYSTEM_OWNED',
        size: 1024,
        type: 'IMAGE',
        uri: 'file:///cache/good.jpg',
      });
    jest.mocked(confirmReportAssetUpload).mockReset().mockResolvedValue({
      data: confirmedAsset,
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await flushPromises();
    });

    expect(uploadReportAssetToStorage).toHaveBeenCalledTimes(1);
    expect(presenter?.localAssets).toEqual([
      expect.objectContaining({
        errorCode: 'IMAGE_HEIC_CONVERSION_FAILED',
        retryKind: 'REPICK',
        status: 'FAILED',
      }),
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'report.multi_photo_item_upload_failed',
      expect.objectContaining({ errorCode: 'IMAGE_HEIC_CONVERSION_FAILED', stage: 'METADATA_NORMALIZING' }),
    );
  });

  it('keeps a failed batch upload retryable without cancelling sibling uploads', async () => {
    jest.mocked(pickReportImages).mockResolvedValue(
      Array.from({ length: 3 }, (_, index) => ({
        fileName: `photo-${index}.jpg`,
        fileSize: 1024,
        mimeType: 'image/jpeg',
        uri: `file:///cache/photo-${index}.jpg`,
      })),
    );
    jest.mocked(normalizeReportImageSelection).mockImplementation(async (selection) => ({
      fileName: selection.fileName as string,
      mimeType: 'image/jpeg',
      ownership: 'SYSTEM_OWNED',
      size: 1024,
      type: 'IMAGE',
      uri: selection.uri as string,
    }));
    let requestIndex = 0;
    jest.mocked(requestReportAssetUpload).mockImplementation(async () => ({
      data: {
        assetId: `asset-${requestIndex++}`,
        expiresAt: '2099-08-11T10:00:00.000Z',
        upload: { fields: {}, method: 'POST', url: 'https://storage.test' },
      },
      isError: false,
      message: '',
    }));
    jest.mocked(uploadReportAssetToStorage).mockRejectedValueOnce(new Error('storage failed'));
    jest.mocked(confirmReportAssetUpload).mockReset().mockResolvedValue({
      data: confirmedAsset,
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await flushPromises();
    });

    expect(uploadReportAssetToStorage).toHaveBeenCalledTimes(3);
    expect(confirmReportAssetUpload).toHaveBeenCalledTimes(2);
    expect(presenter?.localAssets).toEqual([
      expect.objectContaining({ errorCode: 'IMAGE_STORAGE_UPLOAD_FAILED', status: 'FAILED' }),
    ]);

    const failedId = presenter?.localAssets[0]?.id as string;
    await ReactTestRenderer.act(async () => {
      await presenter?.onRetryUpload(failedId);
      await flushPromises();
    });

    expect(uploadReportAssetToStorage).toHaveBeenCalledTimes(4);
    expect(presenter?.localAssets).toEqual([]);
  });

  it('re-picks only an image whose HEIC normalization failed', async () => {
    jest
      .mocked(pickReportImages)
      .mockResolvedValue([
        { fileName: 'bad.heic', fileSize: 1024, mimeType: 'image/heic', uri: 'file:///cache/bad.heic' },
      ]);
    jest
      .mocked(normalizeReportImageSelection)
      .mockRejectedValue(new ReportAttachmentError('IMAGE', 'IMAGE_HEIC_CONVERSION_FAILED', 'METADATA_NORMALIZING'));
    jest.mocked(confirmReportAssetUpload).mockReset().mockResolvedValue({
      data: confirmedAsset,
      isError: false,
      message: '',
    });

    await ReactTestRenderer.act(async () => {
      await presenter?.onAddPhoto();
      await flushPromises();
    });
    const failedId = presenter?.localAssets[0]?.id as string;

    await ReactTestRenderer.act(async () => {
      await presenter?.onRetryUpload(failedId);
      await flushPromises();
    });

    expect(pickReportImage).toHaveBeenCalledWith('library');
    expect(uploadReportAssetToStorage).toHaveBeenCalledTimes(1);
    expect(presenter?.localAssets).toEqual([]);
  });
});
