import type { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sound from 'react-native-nitro-sound';

import {
  ensureReportAssetFile,
  openReportDocumentAsset,
  ReportAssetAccessError,
} from '@/entities/report/services/reportAssetAccessService';
import type { IReportAsset } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';
import { toastService } from '@/libs/toast/toastService';
import { useCustomAlert } from '@/UIKit/CustomAlert/presenters/useCustomAlert';
import type { ICustomAlertAction } from '@/UIKit/CustomAlert/types';

interface IInput {
  assets: IReportAsset[];
  onDeleteAsset(assetId: string): Promise<boolean>;
  reportId: string;
  t: TFunction;
}

interface IAudioPlayback {
  assetId?: string;
  durationSeconds: number;
  isPlaying: boolean;
  positionSeconds: number;
}

const initialPlayback: IAudioPlayback = {
  durationSeconds: 0,
  isPlaying: false,
  positionSeconds: 0,
};

export const useReportAttachmentAccessPresenter = ({ assets, onDeleteAsset, reportId, t }: IInput) => {
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [previewAssetId, setPreviewAssetId] = useState<string>();
  const [accessingAssetId, setAccessingAssetId] = useState<string>();
  const [deletingAssetId, setDeletingAssetId] = useState<string>();
  const [assetPendingDeletion, setAssetPendingDeletion] = useState<IReportAsset>();
  const [playback, setPlayback] = useState<IAudioPlayback>(initialPlayback);
  const playbackRef = useRef(playback);
  const deletingAssetIdRef = useRef<string | undefined>(undefined);
  const mountedRef = useRef(true);
  const {
    isVisible: isDeleteConfirmationVisible,
    onHide: onHideDeleteConfirmation,
    onShow: onShowDeleteConfirmation,
  } = useCustomAlert();

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    mountedRef.current = true;
    Sound.setSubscriptionDuration(0.2);
    Sound.addPlayBackListener((metadata) => {
      if (!mountedRef.current) {
        return;
      }

      setPlayback((current) => ({
        ...current,
        durationSeconds: metadata.duration / 1_000,
        positionSeconds: metadata.currentPosition / 1_000,
      }));
    });
    Sound.addPlaybackEndListener((metadata) => {
      if (!mountedRef.current) {
        return;
      }

      setPlayback({
        assetId: undefined,
        durationSeconds: metadata.duration / 1_000,
        isPlaying: false,
        positionSeconds: 0,
      });
    });

    return () => {
      mountedRef.current = false;
      Sound.removePlayBackListener();
      Sound.removePlaybackEndListener();
      Sound.stopPlayer().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const readyImages = assets.filter((asset) => asset.type === 'IMAGE' && asset.status === 'READY');

    readyImages.forEach((asset) => {
      if (imageUris[asset.id]) {
        return;
      }

      ensureReportAssetFile(reportId, asset)
        .then((path) => {
          if (mountedRef.current) {
            setImageUris((current) => ({ ...current, [asset.id]: `file://${path}` }));
          }
        })
        .catch((error: unknown) => {
          logger.warn('report.attachment_open_failed', {
            assetType: 'IMAGE',
            errorCode: error instanceof ReportAssetAccessError ? error.code : 'local_exception',
            httpStatus: error instanceof ReportAssetAccessError ? error.httpStatus : undefined,
            operation: 'thumbnail',
          });
        });
    });
  }, [assets, imageUris, reportId]);

  const showAccessFailure = useCallback(
    (operation: 'open_document' | 'open_image' | 'play_audio', error: unknown) => {
      logger.error(operation === 'play_audio' ? 'report.audio_play_failed' : 'report.attachment_open_failed', {
        errorCode: error instanceof ReportAssetAccessError ? error.code : 'local_exception',
        httpStatus: error instanceof ReportAssetAccessError ? error.httpStatus : undefined,
        operation,
      });
      toastService.showError(
        String(
          t(operation === 'play_audio' ? 'reports.attachments.playFailed' : 'reports.attachments.accessFailed'),
        ),
        String(t('reports.attachments.tryAgain')),
      );
    },
    [t],
  );

  const onOpenAsset = useCallback(
    async (asset: IReportAsset) => {
      if (asset.status !== 'READY' || accessingAssetId) {
        return;
      }

      if (asset.type === 'AUDIO') {
        return;
      }

      setAccessingAssetId(asset.id);
      logger.info('report.attachment_open_started', {
        assetType: asset.type,
        operation: asset.type === 'IMAGE' ? 'preview' : 'viewer',
      });
      try {
        if (asset.type === 'IMAGE') {
          const path = await ensureReportAssetFile(reportId, asset);
          if (mountedRef.current) {
            setImageUris((current) => ({ ...current, [asset.id]: `file://${path}` }));
            setPreviewAssetId(asset.id);
          }
          logger.info('report.attachment_opened', { assetType: 'IMAGE', operation: 'preview' });
        } else {
          await openReportDocumentAsset(reportId, asset);
          logger.info('report.attachment_opened', { assetType: 'DOCUMENT', operation: 'viewer' });
        }
      } catch (error) {
        showAccessFailure(asset.type === 'IMAGE' ? 'open_image' : 'open_document', error);
      } finally {
        if (mountedRef.current) {
          setAccessingAssetId(undefined);
        }
      }
    },
    [accessingAssetId, reportId, showAccessFailure],
  );

  const onToggleAudio = useCallback(
    async (asset: IReportAsset) => {
      if (asset.status !== 'READY' || accessingAssetId) {
        return;
      }

      try {
        if (playbackRef.current.assetId === asset.id && playbackRef.current.isPlaying) {
          await Sound.pausePlayer();
          setPlayback((current) => ({ ...current, isPlaying: false }));
          logger.info('report.audio_paused', { assetType: 'AUDIO' });
          return;
        }

        if (playbackRef.current.assetId === asset.id) {
          await Sound.resumePlayer();
          setPlayback((current) => ({ ...current, isPlaying: true }));
          logger.info('report.audio_resumed', { assetType: 'AUDIO' });
          return;
        }

        setAccessingAssetId(asset.id);
        logger.info('report.attachment_open_started', { assetType: 'AUDIO', operation: 'play_audio' });
        if (playbackRef.current.assetId) {
          await Sound.stopPlayer();
        }

        const path = await ensureReportAssetFile(reportId, asset);
        await Sound.startPlayer(path);
        setPlayback({
          assetId: asset.id,
          durationSeconds: asset.durationSeconds ?? 0,
          isPlaying: true,
          positionSeconds: 0,
        });
        logger.info('report.audio_play_started', { assetType: 'AUDIO' });
      } catch (error) {
        setPlayback(initialPlayback);
        showAccessFailure('play_audio', error);
      } finally {
        if (mountedRef.current) {
          setAccessingAssetId(undefined);
        }
      }
    },
    [accessingAssetId, reportId, showAccessFailure],
  );

  const onClosePreview = useCallback(() => {
    setPreviewAssetId(undefined);
  }, []);

  const onRequestDelete = useCallback(
    (asset: IReportAsset) => {
      if (deletingAssetId) {
        return;
      }

      setAssetPendingDeletion(asset);
      onShowDeleteConfirmation();
    },
    [deletingAssetId, onShowDeleteConfirmation],
  );

  const onDismissDeleteConfirmation = useCallback(() => {
    if (!deletingAssetId) {
      onHideDeleteConfirmation();
      setAssetPendingDeletion(undefined);
    }
  }, [deletingAssetId, onHideDeleteConfirmation]);

  const onConfirmDelete = useCallback(async () => {
    if (!assetPendingDeletion || deletingAssetIdRef.current) {
      return;
    }

    const asset = assetPendingDeletion;
    deletingAssetIdRef.current = asset.id;
    setDeletingAssetId(asset.id);
    const wasDeleted = await onDeleteAsset(asset.id);

    if (wasDeleted) {
      if (playbackRef.current.assetId === asset.id) {
        await Sound.stopPlayer().catch(() => undefined);
        setPlayback(initialPlayback);
      }
      setImageUris((current) => {
        const next = { ...current };
        delete next[asset.id];
        return next;
      });
      onHideDeleteConfirmation();
      setAssetPendingDeletion(undefined);
    }

    if (mountedRef.current) {
      deletingAssetIdRef.current = undefined;
      setDeletingAssetId(undefined);
    }
  }, [assetPendingDeletion, onDeleteAsset, onHideDeleteConfirmation]);

  const deleteActions = useMemo<ICustomAlertAction[]>(
    () => [
      {
        disabled: Boolean(deletingAssetId),
        key: 'cancel',
        onPress: onDismissDeleteConfirmation,
        title: String(t('common.cancel')),
        variant: 'secondary',
      },
      {
        key: 'delete',
        loading: Boolean(deletingAssetId),
        onPress: onConfirmDelete,
        title: String(t('reports.attachments.delete')),
        variant: 'danger',
      },
    ],
    [deletingAssetId, onConfirmDelete, onDismissDeleteConfirmation, t],
  );

  const previewImages = assets
    .filter((asset) => asset.type === 'IMAGE' && asset.status === 'READY' && imageUris[asset.id])
    .map((asset) => ({ id: asset.id, uri: imageUris[asset.id] }));

  return {
    accessingAssetId,
    deleteActions,
    deletingAssetId,
    imageUris,
    isDeleteConfirmationVisible,
    onClosePreview,
    onDismissDeleteConfirmation,
    onOpenAsset,
    onRequestDelete,
    onToggleAudio,
    playback,
    previewAssetId,
    previewImages,
  };
};
