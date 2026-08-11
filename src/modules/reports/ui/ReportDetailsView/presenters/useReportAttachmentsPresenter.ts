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
import {
  ReportStorageUploadError,
  uploadReportAssetToStorage,
} from '@/entities/report/services/reportAssetUploadService';
import {
  pickReportDocument,
  pickReportImage,
} from '@/entities/report/services/reportFilePickerService';
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

const getDevelopmentErrorDescription = (errorCode: ReportAttachmentErrorCode, friendly?: string): string | undefined => {
  if (!__DEV__) {
    return friendly;
  }

  return friendly ? `${friendly}\n${errorCode}` : errorCode;
};

const isConnected = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();

  return state.isConnected !== false && state.isInternetReachable !== false;
};

const cleanupTemporaryAsset = async (asset: Pick<IReportAssetCandidate, 'ownership' | 'type' | 'uri'>): Promise<void> => {
  if (await cleanupOwnedLocalFile(asset.uri, asset.ownership)) {
    logger.debug('report.temporary_asset_removed', {
      assetType: asset.type,
      uriScheme: getUriScheme(asset.uri),
    });
  }
};

const getUploadFailure = (
  assetType: ReportAssetType,
  stage: ReportAttachmentStage,
): ReportAttachmentErrorCode => {
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

  const showUploadFailure = useCallback(
    (errorCode: ReportAttachmentErrorCode, friendlyDescription?: string) => {
      toastService.showError(
        String(t('reports.attachments.uploadFailed')),
        getDevelopmentErrorDescription(errorCode, friendlyDescription ?? String(t('reports.attachments.tryAgain'))),
      );
    },
    [t],
  );

  const onUpload = useCallback(
    async (asset: ILocalReportAsset) => {
      if (activeUploadIdsRef.current.has(asset.id)) {
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
            fileName: asset.fileName,
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
          updateLocalAsset(asset.id, {
            errorCode,
            status: 'FAILED',
            uploadRequest: shouldRestartUpload ? undefined : uploadRequest,
          });
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
        showUploadFailure(attachmentError.code);
      } finally {
        activeUploadIdsRef.current.delete(asset.id);
      }
    },
    [reportId, showUploadFailure, t, updateLocalAsset],
  );

  const onAddCandidate = useCallback(
    (candidate: IReportAssetCandidate | undefined) => {
      if (!candidate) {
        return;
      }

      logAttachmentStage(candidate.type, 'VALIDATING', { platform: Platform.OS });
      const pendingCandidates: IReportAssetCandidate[] = localAssets
        .filter((asset) => asset.status !== 'READY')
        .map((asset) => ({ ...asset }));
      const validationError = validateReportAssetCandidate(candidate, assetsQuery.data ?? [], pendingCandidates);

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
        id,
        progress: 0,
        status: 'LOCAL',
      };

      setLocalAssets((current) => [...current, localAsset]);
      onUpload(localAsset).catch(() => undefined);
    },
    [assetsQuery.data, localAssets, onUpload, t],
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

  const onAddPhoto = useCallback(async () => {
    try {
      onAddCandidate(await pickReportImage('library'));
    } catch (error) {
      showPickerFailure(error, 'IMAGE');
    }
  }, [onAddCandidate, showPickerFailure]);

  const onTakePhoto = useCallback(async () => {
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
  }, [onAddCandidate, showPickerFailure, t]);

  const onAddDocument = useCallback(async () => {
    try {
      onAddCandidate(await pickReportDocument());
    } catch (error) {
      showPickerFailure(error, 'DOCUMENT');
    }
  }, [onAddCandidate, showPickerFailure]);

  const onStartRecording = useCallback(async () => {
    try {
      if (!(await requestMicrophonePermission())) {
        const error = new ReportAttachmentError('AUDIO', 'AUDIO_PERMISSION_DENIED', 'PERMISSION_REQUEST');
        logAttachmentFailure('AUDIO', error.stage, error.code, { platform: Platform.OS });
        toastService.showError(
          String(t('reports.attachments.permissionTitle')),
          getDevelopmentErrorDescription(error.code, String(t('reports.attachments.microphonePermission'))),
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
      const error = new ReportAttachmentError('AUDIO', 'AUDIO_RECORDER_STOP_FAILED', 'RECORDER_STOP');
      logAttachmentFailure('AUDIO', error.stage, error.code, { platform: Platform.OS, status: 'cancelled' });
      toastService.showError(
        String(t('reports.attachments.recordingFailed')),
        getDevelopmentErrorDescription(error.code),
      );
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
    hasReadyAssets:
      (assetsQuery.data?.some((asset) => asset.status === 'READY') ?? false) ||
      localAssets.some((asset) => asset.status === 'READY'),
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
