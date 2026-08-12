import type { TFunction } from 'i18next';
import { useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import { reportAssetLimits } from '@/entities/report/config/reportAssetLimits';
import { ReportAttachmentError } from '@/entities/report/model/ReportAttachmentError';
import { getLocalReportAssetDisplayName } from '@/entities/report/model/reportDisplayNames';
import { validateReportAssetCandidate } from '@/entities/report/model/reportAssetValidation';
import { normalizeReportImageSelection, pickReportImages } from '@/entities/report/services/reportFilePickerService';
import type { ILocalReportAsset, IReportAsset, IReportAssetCandidate } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';
import { toastService } from '@/libs/toast/toastService';

interface IInput {
  assets: IReportAsset[];
  canEdit: boolean;
  localAssets: ILocalReportAsset[];
  onUpload(asset: ILocalReportAsset): Promise<void>;
  setLocalAssets: Dispatch<SetStateAction<ILocalReportAsset[]>>;
  showPickerFailure(error: unknown, assetType: 'IMAGE'): void;
  t: TFunction;
  updateLocalAsset(id: string, update: Partial<ILocalReportAsset>): void;
}

const uploadConcurrency = 3;

export const useReportMultiPhotoPresenter = ({
  assets,
  canEdit,
  localAssets,
  onUpload,
  setLocalAssets,
  showPickerFailure,
  t,
  updateLocalAsset,
}: IInput) => {
  const activeUploadCountRef = useRef(0);
  const uploadQueueRef = useRef<ILocalReportAsset[]>([]);

  const onEnqueueUpload = useCallback(
    (asset: ILocalReportAsset) => {
      uploadQueueRef.current.push(asset);

      const drainQueue = () => {
        while (activeUploadCountRef.current < uploadConcurrency && uploadQueueRef.current.length > 0) {
          const nextAsset = uploadQueueRef.current.shift();
          if (!nextAsset) {
            return;
          }

          activeUploadCountRef.current += 1;
          onUpload(nextAsset)
            .catch(() => undefined)
            .finally(() => {
              activeUploadCountRef.current -= 1;
              drainQueue();
            });
        }
      };

      drainQueue();
    },
    [onUpload],
  );

  const onProcessSelections = useCallback(
    async (
      selections: Awaited<ReturnType<typeof pickReportImages>>,
      placeholders: ILocalReportAsset[],
      basePosition: number,
    ) => {
      if (!selections) {
        return;
      }

      const existingServerAssets = assets.filter((asset) => asset.status !== 'REJECTED');
      const existingLocalCandidates: IReportAssetCandidate[] = localAssets.map((asset) => ({ ...asset }));
      const acceptedBatchCandidates: IReportAssetCandidate[] = [];

      for (const [index, selection] of selections.entries()) {
        const placeholder = placeholders[index];
        if (!placeholder) {
          continue;
        }

        try {
          const candidate = await normalizeReportImageSelection(selection);
          const validationError = validateReportAssetCandidate(candidate, existingServerAssets, [
            ...existingLocalCandidates,
            ...acceptedBatchCandidates,
          ]);

          if (validationError) {
            updateLocalAsset(placeholder.id, {
              errorCode: validationError,
              retryKind: 'REPICK',
              status: 'FAILED',
            });
            logger.warn('report.multi_photo_item_upload_failed', {
              assetType: 'IMAGE',
              errorCode: validationError,
              platform: Platform.OS,
              stage: 'VALIDATING',
            });
            continue;
          }

          acceptedBatchCandidates.push(candidate);
          const localAsset: ILocalReportAsset = {
            ...placeholder,
            ...candidate,
            displayName: getLocalReportAssetDisplayName(candidate, basePosition + index, {
              audioRecording: String(t('reports.attachments.audioRecordingName')),
              file: String(t('reports.attachments.fileName')),
              photo: String(t('reports.attachments.photoName')),
            }),
          };
          updateLocalAsset(placeholder.id, localAsset);
          onEnqueueUpload(localAsset);
        } catch (error) {
          const attachmentError =
            error instanceof ReportAttachmentError
              ? error
              : new ReportAttachmentError('IMAGE', 'IMAGE_VALIDATION_FAILED', 'METADATA_NORMALIZING');
          updateLocalAsset(placeholder.id, {
            errorCode: attachmentError.code,
            retryKind: 'REPICK',
            status: 'FAILED',
          });
          logger.warn('report.multi_photo_item_upload_failed', {
            assetType: 'IMAGE',
            errorCode: attachmentError.code,
            platform: Platform.OS,
            stage: attachmentError.stage,
          });
        }
      }
    },
    [assets, localAssets, onEnqueueUpload, t, updateLocalAsset],
  );

  const onAddPhoto = useCallback(async () => {
    if (!canEdit) {
      return;
    }

    const serverImageCount = assets.filter((asset) => asset.type === 'IMAGE' && asset.status !== 'REJECTED').length;
    const localImageCount = localAssets.filter((asset) => asset.type === 'IMAGE').length;
    const remainingCapacity = Math.max(0, reportAssetLimits.reportMaxImages - serverImageCount - localImageCount);

    if (remainingCapacity === 0) {
      toastService.showError(
        String(t('reports.attachments.invalid')),
        String(t('reports.attachments.validation.tooManyFiles')),
      );
      return;
    }

    try {
      const selections = await pickReportImages(remainingCapacity);
      if (!selections) {
        return;
      }

      const basePosition = Math.max(-1, ...assets.map((asset) => asset.position)) + localAssets.length + 2;
      const placeholders = selections.map(
        (selection, index): ILocalReportAsset => ({
          displayName: `${String(t('reports.attachments.photoName'))} ${basePosition + index}`,
          fileName: selection.fileName ?? `photo-${basePosition + index}.jpg`,
          height: selection.height,
          id: uuidv4(),
          isMultiPhotoBatch: true,
          mimeType: selection.mimeType ?? 'image/jpeg',
          ownership: 'SYSTEM_OWNED',
          progress: 0,
          size: selection.fileSize ?? 0,
          status: 'LOCAL',
          type: 'IMAGE',
          uri: selection.uri ?? '',
          width: selection.width,
        }),
      );

      setLocalAssets((current) => [...current, ...placeholders]);
      onProcessSelections(selections, placeholders, basePosition).catch((error: unknown) => {
        showPickerFailure(error, 'IMAGE');
      });
    } catch (error) {
      showPickerFailure(error, 'IMAGE');
    }
  }, [assets, canEdit, localAssets, onProcessSelections, setLocalAssets, showPickerFailure, t]);

  return { onAddPhoto };
};
