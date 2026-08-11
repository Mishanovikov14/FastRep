import NetInfo from '@react-native-community/netinfo';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { v4 as uuidv4 } from 'uuid';

import { confirmReportAssetUpload, requestReportAssetUpload } from '@/entities/report/API/reportAssetsApi';
import { reportAssetLimits } from '@/entities/report/config/reportAssetLimits';
import { validateReportAssetCandidate } from '@/entities/report/model/reportAssetValidation';
import {
  cancelReportAudioRecording,
  requestMicrophonePermission,
  startReportAudioRecording,
  stopReportAudioRecording,
} from '@/entities/report/services/reportAudioRecordingService';
import { uploadReportAssetToStorage } from '@/entities/report/services/reportAssetUploadService';
import { pickReportDocument, pickReportImage } from '@/entities/report/services/reportFilePickerService';
import type { ILocalReportAsset, IReportAsset, IReportAssetCandidate } from '@/entities/report/types/reportAsset';
import { queryClient } from '@/libs/query/QueryClient';
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

export const useReportAttachmentsPresenter = ({ canEdit, reportId, t }: IInput) => {
  const assetsQuery = useReportAssetsQuery(reportId);
  const deleteMutation = useDeleteReportAssetMutation(reportId);
  const [localAssets, setLocalAssets] = useState<ILocalReportAsset[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const isMountedRef = useRef(true);
  const isStoppingRecordingRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (isRecording) {
        cancelReportAudioRecording().catch(() => undefined);
      }
    };
  }, [isRecording]);

  const updateLocalAsset = useCallback((id: string, update: Partial<ILocalReportAsset>) => {
    if (isMountedRef.current) {
      setLocalAssets((current) => current.map((asset) => (asset.id === id ? { ...asset, ...update } : asset)));
    }
  }, []);

  const onUpload = useCallback(
    async (asset: ILocalReportAsset) => {
      if (!(await isConnected())) {
        updateLocalAsset(asset.id, { errorCode: 'uploadFailed', status: 'FAILED' });
        toastService.showError(String(t('reports.attachments.uploadFailed')), String(t('reports.errors.network')));
        return;
      }

      let uploadRequest = asset.uploadRequest;

      try {
        if (!uploadRequest || new Date(uploadRequest.expiresAt).getTime() <= Date.now()) {
          updateLocalAsset(asset.id, { errorCode: undefined, status: 'REQUESTING_UPLOAD' });
          const response = await requestReportAssetUpload(reportId, {
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            size: asset.size,
            type: asset.type,
          });

          if (response.isError || !response.data) {
            updateLocalAsset(asset.id, { errorCode: 'uploadFailed', status: 'FAILED' });
            toastService.showError(String(t('reports.attachments.uploadFailed')), String(t('reports.attachments.tryAgain')));
            return;
          }

          uploadRequest = response.data;
          updateLocalAsset(asset.id, { assetId: uploadRequest.assetId, uploadRequest });
        }

        if (asset.errorCode !== 'confirmFailed') {
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
        const confirmResponse = await confirmReportAssetUpload(reportId, uploadRequest.assetId);

        if (confirmResponse.isError || !confirmResponse.data) {
          updateLocalAsset(asset.id, { errorCode: 'confirmFailed', status: 'FAILED', uploadRequest });
          toastService.showError(String(t('reports.attachments.confirmFailed')), String(t('reports.attachments.tryAgain')));
          return;
        }

        updateLocalAsset(asset.id, { progress: 100, status: 'READY' });
        queryClient.setQueryData<IReportAsset[]>(reportsQueryKeys.assets(reportId), (current = []) => [
          ...current.filter((item) => item.id !== confirmResponse.data?.id),
          confirmResponse.data as IReportAsset,
        ]);
        setLocalAssets((current) => current.filter((item) => item.id !== asset.id));
        if (asset.type === 'AUDIO') {
          const localPath = asset.uri.replace('file://', '');
          RNFS.exists(localPath)
            .then((exists) => (exists ? RNFS.unlink(localPath) : undefined))
            .catch(() => undefined);
        }
        queryClient.invalidateQueries({ queryKey: reportsQueryKeys.assets(reportId) }).catch(() => undefined);
      } catch {
        updateLocalAsset(asset.id, { errorCode: 'uploadFailed', status: 'FAILED', uploadRequest });
        toastService.showError(String(t('reports.attachments.uploadFailed')), String(t('reports.attachments.tryAgain')));
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
    } catch {
      toastService.showError(String(t('reports.attachments.photoFailed')));
    }
  }, [onAddCandidate, t]);

  const onTakePhoto = useCallback(async () => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    const permissionResult = await request(permission);

    if (permissionResult !== RESULTS.GRANTED) {
      toastService.showError(String(t('reports.attachments.permissionTitle')), String(t('reports.attachments.cameraPermission')));
      return;
    }

    try {
      onAddCandidate(await pickReportImage('camera'));
    } catch {
      toastService.showError(String(t('reports.attachments.photoFailed')));
    }
  }, [onAddCandidate, t]);

  const onAddDocument = useCallback(async () => {
    try {
      onAddCandidate(await pickReportDocument());
    } catch {
      // Document picker cancellation is not an error requiring feedback.
    }
  }, [onAddCandidate]);

  const onStartRecording = useCallback(async () => {
    if (!(await requestMicrophonePermission())) {
      toastService.showError(
        String(t('reports.attachments.permissionTitle')),
        String(t('reports.attachments.microphonePermission')),
      );
      return;
    }

    try {
      setRecordingDuration(0);
      setIsRecording(true);
      await startReportAudioRecording((seconds) => {
        if (isMountedRef.current) {
          setRecordingDuration(Math.min(seconds, reportAssetLimits.audioMaxDurationSeconds));
        }
      });
    } catch {
      setIsRecording(false);
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
      setIsRecording(false);
      onAddCandidate(candidate);
    } catch {
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
    await cancelReportAudioRecording();
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

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
      if (asset?.type === 'AUDIO') {
        const path = asset.uri.replace('file://', '');
        RNFS.exists(path)
          .then((exists) => (exists ? RNFS.unlink(path) : undefined))
          .catch(() => undefined);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const onRemoveServerAsset = useCallback(
    async (assetId: string) => {
      const response = await deleteMutation.mutateAsync(assetId);
      if (response.isError && response.status !== 404) {
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
