import NetInfo from '@react-native-community/netinfo';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { v4 as uuidv4 } from 'uuid';

import {
  confirmReportAssetUpload,
  deleteReportAsset,
  requestReportAssetUpload,
} from '@/entities/report/API/reportAssetsApi';
import { reportAssetLimits } from '@/entities/report/config/reportAssetLimits';
import { validateReportAssetCandidate } from '@/entities/report/model/reportAssetValidation';
import {
  cancelReportAudioRecording,
  requestMicrophonePermission,
  startReportAudioRecording,
  stopReportAudioRecording,
} from '@/entities/report/services/reportAudioRecordingService';
import { uploadReportAssetToStorage } from '@/entities/report/services/reportAssetUploadService';
import {
  pickReportDocument,
  pickReportImage,
  ReportFilePickerError,
} from '@/entities/report/services/reportFilePickerService';
import type { ILocalReportAsset, IReportAsset, IReportAssetCandidate } from '@/entities/report/types/reportAsset';
import { queryClient } from '@/libs/query/QueryClient';
import { logger } from '@/libs/logger/logger';
import { toastService } from '@/libs/toast/toastService';
import { useDeleteReportAssetMutation, useReportAssetsQuery } from '@/modules/reports/presenters/reportAssetQueries';
import { reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';

interface IInput {
  canEdit: boolean;
  reportId: string;
  t: TFunction;
}

const isConnected = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();

  return state.isConnected !== false && state.isInternetReachable !== false;
};

const cleanupTemporaryAsset = async (uri: string): Promise<void> => {
  if (!uri.startsWith('file://')) {
    return;
  }

  const path = decodeURI(uri.slice('file://'.length));
  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
    logger.debug('report.temporary_asset_removed', { uriScheme: 'file' });
  }
};

export const useReportAttachmentsPresenter = ({ canEdit, reportId, t }: IInput) => {
  const assetsQuery = useReportAssetsQuery(reportId);
  const deleteMutation = useDeleteReportAssetMutation(reportId);
  const [localAssets, setLocalAssets] = useState<ILocalReportAsset[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const activeUploadIdsRef = useRef(new Set<string>());
  const isMountedRef = useRef(true);
  const isRecordingRef = useRef(false);
  const isStoppingRecordingRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (isRecordingRef.current) {
        cancelReportAudioRecording().catch(() => undefined);
      }
    };
  }, []);

  const updateLocalAsset = useCallback((id: string, update: Partial<ILocalReportAsset>) => {
    if (isMountedRef.current) {
      setLocalAssets((current) => current.map((asset) => (asset.id === id ? { ...asset, ...update } : asset)));
    }
  }, []);

  const onUpload = useCallback(
    async (asset: ILocalReportAsset) => {
      if (activeUploadIdsRef.current.has(asset.id)) {
        return;
      }

      activeUploadIdsRef.current.add(asset.id);
      let uploadRequest = asset.uploadRequest;
      const isConfirmationRetry = asset.errorCode === 'confirmFailed' && Boolean(uploadRequest);

      try {
        if (!(await isConnected())) {
          logger.warn('report.asset_upload_blocked', { assetType: asset.type, errorCode: 'offline' });
          updateLocalAsset(asset.id, { errorCode: 'uploadFailed', status: 'FAILED' });
          toastService.showError(String(t('reports.attachments.uploadFailed')), String(t('reports.errors.network')));
          return;
        }

        const hasExpiredUploadRequest =
          Boolean(uploadRequest) &&
          !isConfirmationRetry &&
          new Date(uploadRequest?.expiresAt ?? 0).getTime() <= Date.now();

        if (hasExpiredUploadRequest && uploadRequest) {
          try {
            const cleanupResponse = await deleteReportAsset(reportId, uploadRequest.assetId);
            if (cleanupResponse.isError && cleanupResponse.status !== 404) {
              logger.warn('report.abandoned_asset_cleanup_failed', { httpStatus: cleanupResponse.status });
            }
          } catch {
            logger.warn('report.abandoned_asset_cleanup_failed', { errorCode: 'local_exception' });
          }
        }

        if (!uploadRequest || hasExpiredUploadRequest) {
          updateLocalAsset(asset.id, { errorCode: undefined, status: 'REQUESTING_UPLOAD' });
          logger.debug('report.asset_upload_request_started', { assetType: asset.type, operation: 'upload_request' });
          const response = await requestReportAssetUpload(reportId, {
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            size: asset.size,
            type: asset.type,
          });

          if (response.isError || !response.data) {
            logger.warn('report.asset_upload_request_failed', {
              assetType: asset.type,
              errorCode: response.type ?? 'request_failed',
              httpStatus: response.status,
            });
            updateLocalAsset(asset.id, { errorCode: 'uploadFailed', status: 'FAILED' });
            toastService.showError(String(t('reports.attachments.uploadFailed')), String(t('reports.attachments.tryAgain')));
            return;
          }

          uploadRequest = response.data;
          logger.info('report.asset_upload_request_accepted', { assetType: asset.type, operation: 'upload_request' });
          updateLocalAsset(asset.id, { assetId: uploadRequest.assetId, uploadRequest });
        }

        if (!isConfirmationRetry) {
          updateLocalAsset(asset.id, { errorCode: undefined, status: 'UPLOADING' });
          await uploadReportAssetToStorage({
            contract: uploadRequest.upload,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            onProgress: (progress) => updateLocalAsset(asset.id, { progress }),
            uri: asset.uri,
          });
        }

        updateLocalAsset(asset.id, { assetId: uploadRequest.assetId, errorCode: undefined, status: 'CONFIRMING' });
        logger.debug('report.asset_upload_confirmation_started', { assetType: asset.type, operation: 'confirm_upload' });
        const confirmResponse = await confirmReportAssetUpload(reportId, uploadRequest.assetId);

        if (confirmResponse.isError || !confirmResponse.data) {
          logger.warn('report.asset_upload_confirmation_failed', {
            assetType: asset.type,
            errorCode: confirmResponse.type ?? 'request_failed',
            httpStatus: confirmResponse.status,
          });
          const shouldRestartUpload = confirmResponse.status === 404 || confirmResponse.status === 410;
          updateLocalAsset(asset.id, {
            errorCode: shouldRestartUpload ? 'uploadFailed' : 'confirmFailed',
            status: 'FAILED',
            uploadRequest: shouldRestartUpload ? undefined : uploadRequest,
          });
          toastService.showError(String(t('reports.attachments.confirmFailed')), String(t('reports.attachments.tryAgain')));
          return;
        }

        updateLocalAsset(asset.id, { progress: 100, status: 'READY' });
        logger.info('report.asset_upload_confirmation_completed', { assetType: asset.type, operation: 'confirm_upload' });
        queryClient.setQueryData<IReportAsset[]>(reportsQueryKeys.assets(reportId), (current = []) => [
          ...current.filter((item) => item.id !== confirmResponse.data?.id),
          confirmResponse.data as IReportAsset,
        ]);
        setLocalAssets((current) => current.filter((item) => item.id !== asset.id));
        cleanupTemporaryAsset(asset.uri).catch(() => {
          logger.warn('report.temporary_asset_cleanup_failed', { assetType: asset.type, uriScheme: 'file' });
        });
        queryClient.invalidateQueries({ queryKey: reportsQueryKeys.assets(reportId) }).catch(() => undefined);
      } catch {
        logger.error('report.asset_upload_failed', { assetType: asset.type, errorCode: 'unexpected_failure' });
        updateLocalAsset(asset.id, { errorCode: 'uploadFailed', status: 'FAILED', uploadRequest });
        toastService.showError(String(t('reports.attachments.uploadFailed')), String(t('reports.attachments.tryAgain')));
      } finally {
        activeUploadIdsRef.current.delete(asset.id);
      }
    },
    [reportId, t, updateLocalAsset],
  );

  const onAddCandidate = useCallback(
    (candidate: IReportAssetCandidate | undefined) => {
      if (!candidate) {
        return;
      }

      const pendingCandidates: IReportAssetCandidate[] = localAssets
        .filter((asset) => asset.status !== 'READY')
        .map((asset) => ({ ...asset }));
      const errorCode = validateReportAssetCandidate(candidate, assetsQuery.data ?? [], pendingCandidates);

      if (errorCode) {
        logger.debug('report.asset_validation_failed', { assetType: candidate.type, errorCode });
        cleanupTemporaryAsset(candidate.uri).catch(() => undefined);
        toastService.showError(
          String(t('reports.attachments.invalid')),
          String(t(`reports.attachments.validation.${errorCode}`)),
        );
        return;
      }

      const localAsset: ILocalReportAsset = {
        ...candidate,
        id: uuidv4(),
        progress: 0,
        status: 'LOCAL',
      };

      setLocalAssets((current) => [...current, localAsset]);
      onUpload(localAsset).catch(() => undefined);
    },
    [assetsQuery.data, localAssets, onUpload, t],
  );

  const onAddPhoto = useCallback(async () => {
    try {
      onAddCandidate(await pickReportImage('library'));
    } catch (error) {
      const key =
        error instanceof ReportFilePickerError && error.code === 'heic_conversion_failed'
          ? 'reports.attachments.photoConversionFailed'
          : 'reports.attachments.photoFailed';
      toastService.showError(String(t(key)));
    }
  }, [onAddCandidate, t]);

  const onTakePhoto = useCallback(async () => {
    try {
      const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      const permissionResult = await request(permission);

      if (permissionResult !== RESULTS.GRANTED) {
        logger.debug('report.camera_permission_denied', { assetType: 'IMAGE', platform: Platform.OS });
        toastService.showError(
          String(t('reports.attachments.permissionTitle')),
          String(t('reports.attachments.cameraPermission')),
        );
        return;
      }

      onAddCandidate(await pickReportImage('camera'));
    } catch (error) {
      const key =
        error instanceof ReportFilePickerError && error.code === 'heic_conversion_failed'
          ? 'reports.attachments.photoConversionFailed'
          : 'reports.attachments.photoFailed';
      toastService.showError(String(t(key)));
    }
  }, [onAddCandidate, t]);

  const onAddDocument = useCallback(async () => {
    try {
      onAddCandidate(await pickReportDocument());
    } catch (error) {
      const descriptionKey =
        error instanceof ReportFilePickerError && error.code === 'unsupported_type'
          ? 'reports.attachments.validation.unsupportedType'
          : error instanceof ReportFilePickerError &&
              (error.code === 'copy_failed' || error.code === 'file_unreadable')
            ? 'reports.attachments.validation.missingFileMetadata'
            : 'reports.attachments.tryAgain';
      toastService.showError(String(t('reports.attachments.documentFailed')), String(t(descriptionKey)));
    }
  }, [onAddCandidate, t]);

  const onStartRecording = useCallback(async () => {
    try {
      if (!(await requestMicrophonePermission())) {
        toastService.showError(
          String(t('reports.attachments.permissionTitle')),
          String(t('reports.attachments.microphonePermission')),
        );
        return;
      }

      setRecordingDuration(0);
      isRecordingRef.current = true;
      await startReportAudioRecording((seconds) => {
        if (isMountedRef.current) {
          setRecordingDuration(Math.min(seconds, reportAssetLimits.audioMaxDurationSeconds));
        }
      });
      if (!isMountedRef.current) {
        await cancelReportAudioRecording();
        isRecordingRef.current = false;
        return;
      }
      setIsRecording(true);
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      logger.error('report.audio_recording_start_failed', { assetType: 'AUDIO', errorCode: 'local_exception' });
      toastService.showError(String(t('reports.attachments.recordingFailed')));
    }
  }, [t]);

  const onStopRecording = useCallback(async () => {
    if (isStoppingRecordingRef.current) {
      return;
    }

    isStoppingRecordingRef.current = true;
    try {
      const candidate = await stopReportAudioRecording(recordingDuration);
      isRecordingRef.current = false;
      setIsRecording(false);
      onAddCandidate(candidate);
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      cancelReportAudioRecording().catch(() => undefined);
      logger.error('report.audio_recording_stop_failed', { assetType: 'AUDIO', errorCode: 'local_exception' });
      toastService.showError(String(t('reports.attachments.recordingFailed')));
    } finally {
      isStoppingRecordingRef.current = false;
    }
  }, [onAddCandidate, recordingDuration, t]);

  useEffect(() => {
    if (isRecording && recordingDuration >= reportAssetLimits.audioMaxDurationSeconds) {
      onStopRecording().catch(() => undefined);
    }
  }, [isRecording, onStopRecording, recordingDuration]);

  const onCancelRecording = useCallback(async () => {
    try {
      await cancelReportAudioRecording();
    } catch {
      logger.warn('report.audio_recording_cleanup_failed', { assetType: 'AUDIO', errorCode: 'local_exception' });
      toastService.showError(String(t('reports.attachments.recordingFailed')));
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordingDuration(0);
    }
  }, [t]);

  const onRetryUpload = useCallback(
    (id: string) => {
      const asset = localAssets.find((item) => item.id === id);
      if (asset) {
        onUpload(asset).catch(() => undefined);
      }
    },
    [localAssets, onUpload],
  );

  const onRemoveLocalAsset = useCallback((id: string) => {
    setLocalAssets((current) => {
      const asset = current.find((item) => item.id === id);
      if (asset) {
        cleanupTemporaryAsset(asset.uri).catch(() => {
          logger.warn('report.temporary_asset_cleanup_failed', { assetType: asset.type, uriScheme: 'file' });
        });
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const onRemoveServerAsset = useCallback(
    async (assetId: string) => {
      try {
        const response = await deleteMutation.mutateAsync(assetId);
        if (response.isError && response.status !== 404) {
          logger.warn('report.asset_remove_failed', { httpStatus: response.status });
          toastService.showError(String(t('reports.attachments.removeFailed')));
        }
      } catch {
        logger.error('report.asset_remove_failed', { errorCode: 'local_exception' });
        toastService.showError(String(t('reports.attachments.removeFailed')));
      }
    },
    [deleteMutation, t],
  );

  const unresolvedAssets = localAssets.filter((asset) => asset.status !== 'READY');

  return {
    assets: assetsQuery.data ?? [],
    canEdit,
    hasReadyAssets: (assetsQuery.data?.length ?? 0) > 0 || localAssets.some((asset) => asset.status === 'READY'),
    hasUnresolvedAssets: unresolvedAssets.length > 0,
    isLoadingAssets: assetsQuery.isPending,
    isRecording,
    localAssets,
    onAddDocument,
    onAddPhoto,
    onCancelRecording,
    onRemoveLocalAsset,
    onRemoveServerAsset,
    onRetryUpload,
    onStartRecording,
    onStopRecording,
    onTakePhoto,
    recordingDuration,
  };
};
