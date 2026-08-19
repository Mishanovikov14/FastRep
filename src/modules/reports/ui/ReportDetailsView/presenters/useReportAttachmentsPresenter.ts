import NetInfo from '@react-native-community/netinfo';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { v4 as uuidv4 } from 'uuid';

import {
  confirmReportAssetUpload,
  deleteReportAsset,
  requestReportAssetUpload,
} from '@/entities/report/API/reportAssetsApi';
import { reportAssetLimits } from '@/entities/report/config/reportAssetLimits';
import { ReportAttachmentError } from '@/entities/report/model/ReportAttachmentError';
import { getLocalReportAssetDisplayName } from '@/entities/report/model/reportDisplayNames';
import { reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';
import { validateReportAssetCandidate } from '@/entities/report/model/reportAssetValidation';
import {
  cancelReportAudioRecording,
  requestMicrophonePermission,
  startReportAudioRecording,
  stopReportAudioRecording,
} from '@/entities/report/services/reportAudioRecordingService';
import {
  getUriScheme,
  logAttachmentFailure,
  logAttachmentStage,
} from '@/entities/report/services/reportAttachmentDiagnostics';
import { removeReportAssetCache } from '@/entities/report/services/reportAssetAccessService';
import {
  ReportStorageUploadError,
  uploadReportAssetToStorage,
} from '@/entities/report/services/reportAssetUploadService';
import { pickReportDocument, pickReportImage } from '@/entities/report/services/reportFilePickerService';
import { cleanupOwnedLocalFile } from '@/entities/report/services/reportLocalFileService';
import type {
  ILocalReportAsset,
  IReportAsset,
  IReportAssetCandidate,
  ReportAssetType,
  ReportAttachmentErrorCode,
  ReportAttachmentStage,
} from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';
import { queryClient } from '@/libs/query/QueryClient';
import { toastService } from '@/libs/toast/toastService';
import { useDeleteReportAssetMutation, useReportAssetsQuery } from '@/modules/reports/presenters/reportAssetQueries';

import { useReportMultiPhotoPresenter } from './useReportMultiPhotoPresenter';

interface IInput {
  canEdit: boolean;
  reportId: string;
  t: TFunction;
}

const errorCodesByType: Record<
  ReportAssetType,
  {
    confirm: ReportAttachmentErrorCode;
    storage: ReportAttachmentErrorCode;
    uploadRequest: ReportAttachmentErrorCode;
    validation: ReportAttachmentErrorCode;
  }
> = {
  AUDIO: {
    confirm: 'AUDIO_CONFIRM_FAILED',
    storage: 'AUDIO_STORAGE_UPLOAD_FAILED',
    uploadRequest: 'AUDIO_UPLOAD_REQUEST_FAILED',
    validation: 'AUDIO_VALIDATION_FAILED',
  },
  DOCUMENT: {
    confirm: 'DOCUMENT_CONFIRM_FAILED',
    storage: 'DOCUMENT_STORAGE_UPLOAD_FAILED',
    uploadRequest: 'DOCUMENT_UPLOAD_REQUEST_FAILED',
    validation: 'DOCUMENT_VALIDATION_FAILED',
  },
  IMAGE: {
    confirm: 'IMAGE_CONFIRM_FAILED',
    storage: 'IMAGE_STORAGE_UPLOAD_FAILED',
    uploadRequest: 'IMAGE_UPLOAD_REQUEST_FAILED',
    validation: 'IMAGE_VALIDATION_FAILED',
  },
};

const getDevelopmentErrorDescription = (
  errorCode: ReportAttachmentErrorCode,
  friendly?: string,
): string | undefined => {
  if (!__DEV__) {
    return friendly;
  }

  return friendly ? `${friendly}\n${errorCode}` : errorCode;
};

const isConnected = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();

  return state.isConnected !== false && state.isInternetReachable !== false;
};

const cleanupTemporaryAsset = async (
  asset: Pick<IReportAssetCandidate, 'ownership' | 'type' | 'uri'>,
): Promise<void> => {
  if (await cleanupOwnedLocalFile(asset.uri, asset.ownership)) {
    logger.debug('report.temporary_asset_removed', {
      assetType: asset.type,
      uriScheme: getUriScheme(asset.uri),
    });
  }
};

const getUploadFailure = (assetType: ReportAssetType, stage: ReportAttachmentStage): ReportAttachmentErrorCode => {
  if (stage === 'CONFIRM_STARTED' || stage === 'CONFIRM_SUCCEEDED') {
    return errorCodesByType[assetType].confirm;
  }

  if (stage === 'STORAGE_UPLOAD_STARTED' || stage === 'STORAGE_UPLOAD_SUCCEEDED') {
    return errorCodesByType[assetType].storage;
  }

  return errorCodesByType[assetType].uploadRequest;
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
  const activeDeleteIdsRef = useRef(new Set<string>());
  const rejectedAudioRetryIdRef = useRef<string | undefined>(undefined);
  const [retryingRejectedAssetId, setRetryingRejectedAssetId] = useState<string | undefined>(undefined);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (isRecordingRef.current) {
        cancelReportAudioRecording().catch(() => {
          logger.warn('report.temporary_asset_cleanup_failed', {
            assetType: 'AUDIO',
            errorCode: 'AUDIO_RECORDER_STOP_FAILED',
          });
        });
      }
    };
  }, []);

  const updateLocalAsset = useCallback((id: string, update: Partial<ILocalReportAsset>) => {
    if (isMountedRef.current) {
      setLocalAssets((current) => current.map((asset) => (asset.id === id ? { ...asset, ...update } : asset)));
    }
  }, []);

  const logMultiPhotoFailure = useCallback(
    (asset: Pick<ILocalReportAsset, 'isMultiPhotoBatch'>, errorCode: string, stage: string) => {
      if (asset.isMultiPhotoBatch) {
        logger.warn('report.multi_photo_item_upload_failed', {
          assetType: 'IMAGE',
          errorCode,
          platform: Platform.OS,
          stage,
        });
      }
    },
    [],
  );

  const showUploadFailure = useCallback(
    (errorCode: ReportAttachmentErrorCode, friendlyDescription?: string) => {
      toastService.showError(
        String(t('reports.attachments.uploadFailed')),
        getDevelopmentErrorDescription(errorCode, friendlyDescription ?? String(t('reports.attachments.tryAgain'))),
      );
    },
    [t],
  );

  const deleteServerAsset = useCallback(
    async (assetId: string): Promise<boolean> => {
      if (!canEdit) {
        logger.warn('report.attachment_delete_blocked', { errorCode: 'REPORT_NOT_EDITABLE' });
        return false;
      }

      if (activeDeleteIdsRef.current.has(assetId)) {
        return false;
      }

      activeDeleteIdsRef.current.add(assetId);
      try {
        const response = await deleteMutation.mutateAsync(assetId);
        if (response.isError && response.status !== 404) {
          logger.warn('report.attachment_delete_failed', { httpStatus: response.status });
          toastService.showError(String(t('reports.attachments.removeFailed')));
          return false;
        }

        await removeReportAssetCache(assetId).catch(() => {
          logger.warn('report.asset_cache_cleanup_failed', { errorCode: 'local_exception' });
        });
        return true;
      } catch {
        logger.error('report.attachment_delete_failed', { errorCode: 'local_exception' });
        toastService.showError(String(t('reports.attachments.removeFailed')));
        return false;
      } finally {
        activeDeleteIdsRef.current.delete(assetId);
      }
    },
    [canEdit, deleteMutation, t],
  );

  const onUpload = useCallback(
    async (asset: ILocalReportAsset) => {
      if (activeUploadIdsRef.current.has(asset.id)) {
        return;
      }

      if (!canEdit) {
        logger.warn('report.attachment_upload_blocked', {
          assetType: asset.type,
          errorCode: 'REPORT_NOT_EDITABLE',
        });
        return;
      }

      activeUploadIdsRef.current.add(asset.id);
      let uploadRequest = asset.uploadRequest;
      const isConfirmationRetry = asset.errorCode === errorCodesByType[asset.type].confirm && Boolean(uploadRequest);
      let stage: ReportAttachmentStage = isConfirmationRetry ? 'CONFIRM_STARTED' : 'UPLOAD_REQUEST_STARTED';

      try {
        if (!(await isConnected())) {
          const errorCode = errorCodesByType[asset.type].uploadRequest;
          logAttachmentFailure(asset.type, stage, errorCode, { platform: Platform.OS, status: 'offline' });
          updateLocalAsset(asset.id, { errorCode, status: 'FAILED' });
          logMultiPhotoFailure(asset, errorCode, stage);
          showUploadFailure(errorCode, String(t('reports.errors.network')));
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
              logger.warn('report.abandoned_asset_cleanup_failed', {
                assetType: asset.type,
                httpStatus: cleanupResponse.status,
              });
            }
          } catch {
            logger.warn('report.abandoned_asset_cleanup_failed', {
              assetType: asset.type,
              errorCode: 'local_exception',
            });
          }
        }

        if (!uploadRequest || hasExpiredUploadRequest) {
          stage = 'UPLOAD_REQUEST_STARTED';
          updateLocalAsset(asset.id, { errorCode: undefined, status: 'REQUESTING_UPLOAD' });
          logAttachmentStage(asset.type, stage, { platform: Platform.OS });
          const response = await requestReportAssetUpload(reportId, {
            fileName: asset.displayName,
            mimeType: asset.mimeType,
            size: asset.size,
            type: asset.type,
          });

          if (response.isError || !response.data) {
            const errorCode = errorCodesByType[asset.type].uploadRequest;
            logAttachmentFailure(asset.type, stage, errorCode, {
              httpStatus: response.status,
              platform: Platform.OS,
              status: response.type,
            });
            updateLocalAsset(asset.id, { errorCode, status: 'FAILED' });
            logMultiPhotoFailure(asset, errorCode, stage);
            showUploadFailure(errorCode);
            return;
          }

          uploadRequest = response.data;
          stage = 'UPLOAD_REQUEST_SUCCEEDED';
          logAttachmentStage(asset.type, stage, { platform: Platform.OS });
          updateLocalAsset(asset.id, { assetId: uploadRequest.assetId, uploadRequest });
        }

        if (!isConfirmationRetry) {
          stage = 'STORAGE_UPLOAD_STARTED';
          updateLocalAsset(asset.id, { errorCode: undefined, status: 'UPLOADING' });
          logAttachmentStage(asset.type, stage, {
            mimeType: asset.mimeType,
            platform: Platform.OS,
            uriScheme: getUriScheme(asset.uri),
          });

          try {
            await uploadReportAssetToStorage({
              contract: uploadRequest.upload,
              fileName: asset.fileName,
              mimeType: asset.mimeType,
              onProgress: (progress) => updateLocalAsset(asset.id, { progress }),
              uri: asset.uri,
            });
          } catch (error) {
            const errorCode = errorCodesByType[asset.type].storage;
            logAttachmentFailure(asset.type, stage, errorCode, {
              httpStatus: error instanceof ReportStorageUploadError ? error.httpStatus : undefined,
              platform: Platform.OS,
              status: error instanceof ReportStorageUploadError ? error.failureType : 'local_exception',
            });
            updateLocalAsset(asset.id, { errorCode, status: 'FAILED', uploadRequest });
            logMultiPhotoFailure(asset, errorCode, stage);
            showUploadFailure(errorCode);
            return;
          }

          stage = 'STORAGE_UPLOAD_SUCCEEDED';
          logAttachmentStage(asset.type, stage, { platform: Platform.OS });
        }

        stage = 'CONFIRM_STARTED';
        updateLocalAsset(asset.id, { assetId: uploadRequest.assetId, errorCode: undefined, status: 'CONFIRMING' });
        logAttachmentStage(asset.type, stage, { platform: Platform.OS });
        const confirmResponse = await confirmReportAssetUpload(reportId, uploadRequest.assetId);

        if (confirmResponse.isError || !confirmResponse.data || confirmResponse.data.status !== 'READY') {
          const errorCode = errorCodesByType[asset.type].confirm;
          logAttachmentFailure(asset.type, stage, errorCode, {
            httpStatus: confirmResponse.status,
            platform: Platform.OS,
            status: confirmResponse.data?.status ?? confirmResponse.type,
          });
          const shouldRestartUpload = confirmResponse.status === 404 || confirmResponse.status === 410;
          const isDeterministicRejection =
            confirmResponse.data?.status === 'REJECTED' ||
            ((confirmResponse.status ?? 0) >= 400 && (confirmResponse.status ?? 0) < 500 && !shouldRestartUpload);

          if (isDeterministicRejection) {
            setLocalAssets((current) => current.filter((item) => item.id !== asset.id));
            await cleanupTemporaryAsset(asset);
            await queryClient.invalidateQueries({ queryKey: reportsQueryKeys.assets(reportId) });
          } else {
            updateLocalAsset(asset.id, {
              errorCode,
              status: 'FAILED',
              uploadRequest: shouldRestartUpload ? undefined : uploadRequest,
            });
          }
          logMultiPhotoFailure(asset, errorCode, stage);
          toastService.showError(
            String(t('reports.attachments.confirmFailed')),
            getDevelopmentErrorDescription(errorCode, String(t('reports.attachments.tryAgain'))),
          );
          return;
        }

        stage = 'CONFIRM_SUCCEEDED';
        logAttachmentStage(asset.type, stage, { platform: Platform.OS });
        updateLocalAsset(asset.id, { progress: 100, status: 'READY' });
        logAttachmentStage(asset.type, 'READY', { platform: Platform.OS });
        queryClient.setQueryData<IReportAsset[]>(reportsQueryKeys.assets(reportId), (current = []) => [
          ...current.filter((item) => item.id !== confirmResponse.data?.id),
          confirmResponse.data as IReportAsset,
        ]);
        setLocalAssets((current) => current.filter((item) => item.id !== asset.id));
        cleanupTemporaryAsset(asset).catch(() => {
          logger.warn('report.temporary_asset_cleanup_failed', {
            assetType: asset.type,
            errorCode: 'local_exception',
            uriScheme: getUriScheme(asset.uri),
          });
        });
        queryClient.invalidateQueries({ queryKey: reportsQueryKeys.assets(reportId) }).catch(() => {
          logger.warn('report.asset_refresh_failed', { assetType: asset.type, errorCode: 'local_exception' });
        });
      } catch (error) {
        const attachmentError =
          error instanceof ReportAttachmentError
            ? error
            : new ReportAttachmentError(asset.type, getUploadFailure(asset.type, stage), stage);
        logAttachmentFailure(asset.type, attachmentError.stage, attachmentError.code, { platform: Platform.OS });
        updateLocalAsset(asset.id, { errorCode: attachmentError.code, status: 'FAILED', uploadRequest });
        logMultiPhotoFailure(asset, attachmentError.code, attachmentError.stage);
        showUploadFailure(attachmentError.code);
      } finally {
        activeUploadIdsRef.current.delete(asset.id);
      }
    },
    [canEdit, logMultiPhotoFailure, reportId, showUploadFailure, t, updateLocalAsset],
  );

  const onAddCandidate = useCallback(
    (candidate: IReportAssetCandidate | undefined) => {
      if (!candidate) {
        return false;
      }

      if (!canEdit) {
        logger.warn('report.attachment_add_blocked', {
          assetType: candidate.type,
          errorCode: 'REPORT_NOT_EDITABLE',
        });
        return false;
      }

      logAttachmentStage(candidate.type, 'VALIDATING', { platform: Platform.OS });
      const pendingCandidates: IReportAssetCandidate[] = localAssets
        .filter((asset) => asset.status !== 'READY')
        .map((asset) => ({ ...asset }));
      const editableServerAssets = (assetsQuery.data ?? []).filter((asset) => asset.status !== 'REJECTED');
      const validationError = validateReportAssetCandidate(candidate, editableServerAssets, pendingCandidates);

      if (validationError) {
        const errorCode = errorCodesByType[candidate.type].validation;
        logAttachmentFailure(candidate.type, 'VALIDATING', errorCode, { platform: Platform.OS });
        cleanupTemporaryAsset(candidate).catch(() => {
          logger.warn('report.temporary_asset_cleanup_failed', {
            assetType: candidate.type,
            errorCode: 'local_exception',
            uriScheme: getUriScheme(candidate.uri),
          });
        });
        toastService.showError(
          String(t('reports.attachments.invalid')),
          getDevelopmentErrorDescription(errorCode, String(t(`reports.attachments.validation.${validationError}`))),
        );
        return;
      }

      let id: string;

      try {
        id = uuidv4();
      } catch {
        throw new ReportAttachmentError(candidate.type, errorCodesByType[candidate.type].validation, 'VALIDATING');
      }

      const localAsset: ILocalReportAsset = {
        ...candidate,
        displayName: getLocalReportAssetDisplayName(
          candidate,
          Math.max(-1, ...(assetsQuery.data ?? []).map((asset) => asset.position)) + localAssets.length + 2,
          {
            audioRecording: String(t('reports.attachments.audioRecordingName')),
            file: String(t('reports.attachments.fileName')),
            photo: String(t('reports.attachments.photoName')),
          },
        ),
        id,
        progress: 0,
        status: 'LOCAL',
      };

      setLocalAssets((current) => [...current, localAsset]);
      onUpload(localAsset).catch(() => undefined);
    },
    [assetsQuery.data, canEdit, localAssets, onUpload, t],
  );

  const showPickerFailure = useCallback(
    (error: unknown, assetType: 'DOCUMENT' | 'IMAGE') => {
      const attachmentError =
        error instanceof ReportAttachmentError
          ? error
          : new ReportAttachmentError(assetType, errorCodesByType[assetType].validation, 'VALIDATING');
      logAttachmentFailure(assetType, attachmentError.stage, attachmentError.code, { platform: Platform.OS });

      if (assetType === 'DOCUMENT') {
        toastService.showError(
          String(t('reports.attachments.documentFailed')),
          getDevelopmentErrorDescription(attachmentError.code, String(t('reports.attachments.tryAgain'))),
        );
        return;
      }

      const titleKey =
        attachmentError.code === 'IMAGE_HEIC_CONVERSION_FAILED'
          ? 'reports.attachments.photoConversionFailed'
          : 'reports.attachments.photoFailed';
      toastService.showError(String(t(titleKey)), getDevelopmentErrorDescription(attachmentError.code));
    },
    [t],
  );

  const { onAddPhoto } = useReportMultiPhotoPresenter({
    assets: assetsQuery.data ?? [],
    canEdit,
    localAssets,
    onUpload,
    setLocalAssets,
    showPickerFailure,
    t,
    updateLocalAsset,
  });

  const onTakePhoto = useCallback(async () => {
    if (!canEdit) {
      return;
    }

    logAttachmentStage('IMAGE', 'PERMISSION_REQUEST', { platform: Platform.OS, source: 'camera' });

    try {
      const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      const permissionResult = await request(permission);

      if (permissionResult !== RESULTS.GRANTED) {
        const error = new ReportAttachmentError('IMAGE', 'IMAGE_CAMERA_PERMISSION_DENIED', 'PERMISSION_REQUEST');
        logAttachmentFailure('IMAGE', error.stage, error.code, { platform: Platform.OS, source: 'camera' });
        toastService.showError(
          String(t('reports.attachments.permissionTitle')),
          getDevelopmentErrorDescription(error.code, String(t('reports.attachments.cameraPermission'))),
        );
        return;
      }

      onAddCandidate(await pickReportImage('camera'));
    } catch (error) {
      showPickerFailure(error, 'IMAGE');
    }
  }, [canEdit, onAddCandidate, showPickerFailure, t]);

  const onAddDocument = useCallback(async () => {
    if (!canEdit) {
      return;
    }

    try {
      onAddCandidate(await pickReportDocument());
    } catch (error) {
      showPickerFailure(error, 'DOCUMENT');
    }
  }, [canEdit, onAddCandidate, showPickerFailure]);

  const onStartRecording = useCallback(async (): Promise<boolean> => {
    if (!canEdit) {
      return false;
    }

    try {
      if (!(await requestMicrophonePermission())) {
        const error = new ReportAttachmentError('AUDIO', 'AUDIO_PERMISSION_DENIED', 'PERMISSION_REQUEST');
        logAttachmentFailure('AUDIO', error.stage, error.code, { platform: Platform.OS });
        toastService.showError(
          String(t('reports.attachments.permissionTitle')),
          getDevelopmentErrorDescription(error.code, String(t('reports.attachments.microphonePermission'))),
        );
        return false;
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
        return false;
      }
      setIsRecording(true);
      return true;
    } catch (error) {
      isRecordingRef.current = false;
      setIsRecording(false);
      const attachmentError =
        error instanceof ReportAttachmentError
          ? error
          : new ReportAttachmentError('AUDIO', 'AUDIO_RECORDER_START_FAILED', 'RECORDER_START');
      logAttachmentFailure('AUDIO', attachmentError.stage, attachmentError.code, { platform: Platform.OS });
      toastService.showError(
        String(t('reports.attachments.recordingFailed')),
        getDevelopmentErrorDescription(attachmentError.code),
      );
      return false;
    }
  }, [canEdit, t]);

  const onStopRecording = useCallback(async () => {
    if (isStoppingRecordingRef.current) {
      return;
    }

    isStoppingRecordingRef.current = true;
    try {
      const candidate = await stopReportAudioRecording(recordingDuration);
      isRecordingRef.current = false;
      setIsRecording(false);
      const rejectedAssetId = rejectedAudioRetryIdRef.current;
      rejectedAudioRetryIdRef.current = undefined;
      if (rejectedAssetId) {
        const wasDeleted = await deleteServerAsset(rejectedAssetId);
        if (!wasDeleted) {
          await cleanupTemporaryAsset(candidate);
          return;
        }
      }
      onAddCandidate(candidate);
    } catch (error) {
      isRecordingRef.current = false;
      setIsRecording(false);
      cancelReportAudioRecording().catch(() => {
        logger.warn('report.temporary_asset_cleanup_failed', {
          assetType: 'AUDIO',
          errorCode: 'AUDIO_RECORDER_STOP_FAILED',
        });
      });
      const attachmentError =
        error instanceof ReportAttachmentError
          ? error
          : new ReportAttachmentError('AUDIO', 'AUDIO_RECORDER_STOP_FAILED', 'RECORDER_STOP');
      logAttachmentFailure('AUDIO', attachmentError.stage, attachmentError.code, { platform: Platform.OS });
      toastService.showError(
        String(t('reports.attachments.recordingFailed')),
        getDevelopmentErrorDescription(attachmentError.code),
      );
    } finally {
      rejectedAudioRetryIdRef.current = undefined;
      setRetryingRejectedAssetId(undefined);
      isStoppingRecordingRef.current = false;
    }
  }, [deleteServerAsset, onAddCandidate, recordingDuration, t]);

  useEffect(() => {
    if (isRecording && recordingDuration >= reportAssetLimits.audioMaxDurationSeconds) {
      onStopRecording().catch(() => undefined);
    }
  }, [isRecording, onStopRecording, recordingDuration]);

  const onCancelRecording = useCallback(async () => {
    try {
      await cancelReportAudioRecording();
    } catch {
      const error = new ReportAttachmentError('AUDIO', 'AUDIO_RECORDER_STOP_FAILED', 'RECORDER_STOP');
      logAttachmentFailure('AUDIO', error.stage, error.code, { platform: Platform.OS, status: 'cancelled' });
      toastService.showError(
        String(t('reports.attachments.recordingFailed')),
        getDevelopmentErrorDescription(error.code),
      );
    } finally {
      rejectedAudioRetryIdRef.current = undefined;
      setRetryingRejectedAssetId(undefined);
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordingDuration(0);
    }
  }, [t]);

  const onRetryUpload = useCallback(
    async (id: string) => {
      if (!canEdit) {
        return;
      }

      const asset = localAssets.find((item) => item.id === id);
      if (!asset) {
        return;
      }

      if (asset.retryKind === 'REPICK') {
        try {
          const candidate = await pickReportImage('library');
          if (!candidate) {
            return;
          }

          const pendingCandidates: IReportAssetCandidate[] = localAssets
            .filter((item) => item.id !== id && item.status !== 'READY')
            .map((item) => ({ ...item }));
          const validationError = validateReportAssetCandidate(
            candidate,
            (assetsQuery.data ?? []).filter((item) => item.status !== 'REJECTED'),
            pendingCandidates,
          );
          if (validationError) {
            await cleanupTemporaryAsset(candidate);
            updateLocalAsset(id, { errorCode: validationError, status: 'FAILED' });
            return;
          }

          const replacement: ILocalReportAsset = {
            ...asset,
            ...candidate,
            errorCode: undefined,
            progress: 0,
            retryKind: undefined,
            status: 'LOCAL',
            uploadRequest: undefined,
          };
          cleanupTemporaryAsset(asset).catch(() => undefined);
          updateLocalAsset(id, replacement);
          onUpload(replacement).catch(() => undefined);
        } catch (error) {
          showPickerFailure(error, 'IMAGE');
        }
        return;
      }

      onUpload(asset).catch(() => undefined);
    },
    [assetsQuery.data, canEdit, localAssets, onUpload, showPickerFailure, updateLocalAsset],
  );

  const onRemoveLocalAsset = useCallback(
    (id: string) => {
      if (!canEdit) {
        return;
      }

      setLocalAssets((current) => {
        const asset = current.find((item) => item.id === id);
        if (asset) {
          cleanupTemporaryAsset(asset).catch(() => {
            logger.warn('report.temporary_asset_cleanup_failed', {
              assetType: asset.type,
              errorCode: 'local_exception',
              uriScheme: getUriScheme(asset.uri),
            });
          });
        }
        return current.filter((item) => item.id !== id);
      });
    },
    [canEdit],
  );

  const onRemoveServerAsset = useCallback(
    (assetId: string): Promise<boolean> => deleteServerAsset(assetId),
    [deleteServerAsset],
  );

  const onRetryRejectedAsset = useCallback(
    async (assetId: string) => {
      if (!canEdit || retryingRejectedAssetId) {
        return;
      }

      const asset = assetsQuery.data?.find((item) => item.id === assetId && item.status === 'REJECTED');
      if (!asset) {
        return;
      }

      setRetryingRejectedAssetId(assetId);
      try {
        if (asset.type === 'AUDIO') {
          rejectedAudioRetryIdRef.current = assetId;
          if (!(await onStartRecording())) {
            rejectedAudioRetryIdRef.current = undefined;
            setRetryingRejectedAssetId(undefined);
          }
          return;
        }

        const candidate = asset.type === 'IMAGE' ? await pickReportImage('library') : await pickReportDocument();
        if (!candidate) {
          return;
        }

        if (!(await deleteServerAsset(assetId))) {
          await cleanupTemporaryAsset(candidate);
          return;
        }

        onAddCandidate(candidate);
      } catch (error) {
        logger.warn('report.attachment_retry_failed', { assetType: asset.type, errorCode: 'picker_failed' });
        if (asset.type !== 'AUDIO') {
          showPickerFailure(error, asset.type);
        }
      } finally {
        if (asset.type !== 'AUDIO' || !rejectedAudioRetryIdRef.current) {
          setRetryingRejectedAssetId(undefined);
        }
      }
    },
    [
      assetsQuery.data,
      canEdit,
      onAddCandidate,
      deleteServerAsset,
      onStartRecording,
      retryingRejectedAssetId,
      showPickerFailure,
    ],
  );

  const unresolvedAssets = localAssets.filter((asset) => asset.status !== 'READY');

  return {
    assets: assetsQuery.data ?? [],
    canEdit,
    hasReadyAssets:
      (assetsQuery.data?.some((asset) => asset.status === 'READY') ?? false) ||
      localAssets.some((asset) => asset.status === 'READY'),
    hasUnresolvedAssets:
      unresolvedAssets.length > 0 || (assetsQuery.data?.some((asset) => asset.status === 'PENDING_UPLOAD') ?? false),
    hasRejectedAssets: assetsQuery.data?.some((asset) => asset.status === 'REJECTED') ?? false,
    isLoadingAssets: assetsQuery.isPending,
    isRecording,
    localAssets,
    onAddDocument,
    onAddPhoto,
    onCancelRecording,
    onRemoveLocalAsset,
    onRemoveServerAsset,
    onRetryUpload,
    onRetryRejectedAsset,
    onStartRecording,
    onStopRecording,
    onTakePhoto,
    recordingDuration,
    retryingRejectedAssetId,
  };
};
