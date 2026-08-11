import type { TFunction } from 'i18next';
import React from 'react';
import Sound from 'react-native-nitro-sound';
import ReactTestRenderer from 'react-test-renderer';

import {
  ensureReportAssetFile,
  openReportDocumentAsset,
} from '@/entities/report/services/reportAssetAccessService';
import type { IReportAsset } from '@/entities/report/types/reportAsset';
import { toastService } from '@/libs/toast/toastService';
import { useReportAttachmentAccessPresenter } from '@/modules/reports/ui/ReportDetailsView/presenters/useReportAttachmentAccessPresenter';

jest.mock('@/entities/report/services/reportAssetAccessService', () => {
  class ReportAssetAccessError extends Error {}

  return {
    ensureReportAssetFile: jest.fn(),
    openReportDocumentAsset: jest.fn(),
    ReportAssetAccessError,
  };
});
jest.mock('@/libs/logger/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const t = ((key: string) => key) as unknown as TFunction;
const createAsset = (id: string, type: IReportAsset['type']): IReportAsset => ({
  createdAt: '2026-08-11T10:00:00.000Z',
  declaredMimeType: type === 'AUDIO' ? 'audio/x-m4a' : type === 'IMAGE' ? 'image/jpeg' : 'application/pdf',
  declaredSize: 1024,
  durationSeconds: type === 'AUDIO' ? 15 : null,
  id,
  originalFileName: `${id}.bin`,
  position: 0,
  reportId: 'report-1',
  status: 'READY',
  type,
  updatedAt: '2026-08-11T10:00:00.000Z',
});

const flushPromises = async () => {
  for (let index = 0; index < 4; index += 1) {
    await Promise.resolve();
  }
};

describe('report attachment access presenter', () => {
  let assets: IReportAsset[];
  let onDeleteAsset: jest.MockedFunction<(assetId: string) => Promise<boolean>>;
  let presenter: ReturnType<typeof useReportAttachmentAccessPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useReportAttachmentAccessPresenter({ assets, onDeleteAsset, reportId: 'report-1', t });
    return null;
  };

  const render = async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
      await flushPromises();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    assets = [];
    onDeleteAsset = jest.fn(async (_assetId: string) => true);
    jest.mocked(ensureReportAssetFile).mockImplementation(async (_reportId, asset) => `/cache/${asset.id}`);
    jest.mocked(openReportDocumentAsset).mockResolvedValue();
    jest.mocked(Sound.startPlayer).mockResolvedValue('started');
    jest.mocked(Sound.pausePlayer).mockResolvedValue('paused');
    jest.mocked(Sound.resumePlayer).mockResolvedValue('resumed');
    jest.mocked(Sound.stopPlayer).mockResolvedValue('stopped');
  });

  afterEach(() => {
    ReactTestRenderer.act(() => renderer?.unmount());
  });

  it('opens an image in the in-app preview and a document through the local viewer', async () => {
    const image = createAsset('image-1', 'IMAGE');
    const document = createAsset('document-1', 'DOCUMENT');
    assets = [image, document];
    await render();

    await ReactTestRenderer.act(async () => {
      await presenter?.onOpenAsset(image);
    });
    expect(presenter?.previewAssetId).toBe('image-1');
    expect(presenter?.previewImages).toContainEqual({ id: 'image-1', uri: 'file:///cache/image-1' });

    await ReactTestRenderer.act(async () => {
      await presenter?.onOpenAsset(document);
    });
    expect(openReportDocumentAsset).toHaveBeenCalledWith('report-1', document);
  });

  it('plays, pauses, resumes, and stops the previous audio before starting another', async () => {
    const first = createAsset('audio-1', 'AUDIO');
    const second = createAsset('audio-2', 'AUDIO');
    assets = [first, second];
    await render();

    await ReactTestRenderer.act(async () => presenter?.onToggleAudio(first));
    await ReactTestRenderer.act(async () => presenter?.onToggleAudio(first));
    await ReactTestRenderer.act(async () => presenter?.onToggleAudio(first));
    await ReactTestRenderer.act(async () => presenter?.onToggleAudio(second));

    expect(Sound.startPlayer).toHaveBeenNthCalledWith(1, '/cache/audio-1');
    expect(Sound.pausePlayer).toHaveBeenCalledTimes(1);
    expect(Sound.resumePlayer).toHaveBeenCalledTimes(1);
    expect(Sound.stopPlayer).toHaveBeenCalledTimes(1);
    expect(Sound.startPlayer).toHaveBeenNthCalledWith(2, '/cache/audio-2');

    ReactTestRenderer.act(() => renderer?.unmount());
    expect(Sound.stopPlayer).toHaveBeenCalledTimes(2);
    renderer = undefined;
  });

  it('shows a friendly playback error and releases player listeners on unmount', async () => {
    const audio = createAsset('audio-error', 'AUDIO');
    assets = [audio];
    jest.mocked(Sound.startPlayer).mockRejectedValueOnce(new Error('native failure'));
    const errorSpy = jest.spyOn(toastService, 'showError');
    await render();

    await ReactTestRenderer.act(async () => presenter?.onToggleAudio(audio));
    expect(errorSpy).toHaveBeenCalledWith('reports.attachments.playFailed', 'reports.attachments.tryAgain');

    ReactTestRenderer.act(() => renderer?.unmount());
    expect(Sound.removePlayBackListener).toHaveBeenCalled();
    expect(Sound.removePlaybackEndListener).toHaveBeenCalled();
    errorSpy.mockRestore();
    renderer = undefined;
  });

  it('requires confirmation and prevents duplicate persisted deletion', async () => {
    const asset = createAsset('document-delete', 'DOCUMENT');
    assets = [asset];
    let resolveDelete: ((value: boolean) => void) | undefined;
    onDeleteAsset.mockImplementation(
      () => new Promise<boolean>((resolve) => {
        resolveDelete = resolve;
      }),
    );
    await render();

    ReactTestRenderer.act(() => presenter?.onRequestDelete(asset));
    const deleteAction = presenter?.deleteActions.find((action) => action.key === 'delete');
    ReactTestRenderer.act(() => {
      deleteAction?.onPress();
      deleteAction?.onPress();
    });

    expect(presenter?.isDeleteConfirmationVisible).toBe(true);
    expect(onDeleteAsset).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => {
      resolveDelete?.(true);
      await flushPromises();
    });
    expect(presenter?.isDeleteConfirmationVisible).toBe(false);
  });
});
