import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {
  confirmReportAssetUpload,
  deleteReportAsset,
  requestReportAssetUpload,
} from '@/entities/report/API/reportAssetsApi';
import { uploadReportAssetToStorage } from '@/entities/report/services/reportAssetUploadService';
import { pickReportImage } from '@/entities/report/services/reportFilePickerService';
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
  pickReportDocument: jest.fn(),
  pickReportImage: jest.fn(),
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

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(useReportAssetsQuery).mockReset();
    jest.mocked(useDeleteReportAssetMutation).mockReset();
    jest.mocked(pickReportImage).mockReset();
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
    jest.mocked(confirmReportAssetUpload)
      .mockResolvedValueOnce({ isError: true, message: 'confirm failed', status: 503 })
      .mockResolvedValueOnce({ data: confirmedAsset, isError: false, message: '' });
    jest.mocked(queryClient.invalidateQueries).mockResolvedValue(undefined);

    const Harness = () => {
      presenter = useReportAttachmentsPresenter({ canEdit: true, reportId: 'report-1', t });
      return null;
    };

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
      'VALIDATING',
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

  it('cleans an expired pending slot before requesting a new upload contract', async () => {
    jest.mocked(uploadReportAssetToStorage).mockRejectedValueOnce(new Error('storage unavailable'));
    jest.mocked(requestReportAssetUpload)
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
    jest.mocked(pickReportImage).mockResolvedValue({
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
    expect(logger.error).toHaveBeenCalledWith(
      'report.photo_add_failed',
      expect.objectContaining({ assetType: 'IMAGE', errorCode: 'IMAGE_VALIDATION_FAILED', stage: 'VALIDATING' }),
    );
  });
});
