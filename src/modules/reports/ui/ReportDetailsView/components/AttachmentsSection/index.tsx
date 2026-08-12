import { useMemo } from 'react';
import { Image, Pressable, View } from 'react-native';

import { CameraIcon } from '@/assets/icons/CameraIcon';
import { DocumentIcon } from '@/assets/icons/DocumentIcon';
import { ErrorIcon } from '@/assets/icons/ErrorIcon';
import { MicrophoneIcon } from '@/assets/icons/MicrophoneIcon';
import { PhotoIcon } from '@/assets/icons/PhotoIcon';
import { RetryIcon } from '@/assets/icons/RetryIcon';
import { TrashIcon } from '@/assets/icons/TrashIcon';
import { getReportAssetRejectionKey } from '@/entities/report/model/reportAssetRejection';
import { getReportAssetDisplayName } from '@/entities/report/model/reportDisplayNames';
import { formatAudioDuration, formatFileSize } from '@/entities/report/model/reportAssetValidation';
import type { ILocalReportAsset, IReportAsset } from '@/entities/report/types/reportAsset';
import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';
import { scaleHorizontal } from '@/utils/scaling';

import { AttachmentCard } from '../AttachmentCard';
import { getStyles } from './styles';

interface IProps {
  accessingAssetId?: string;
  assets: IReportAsset[];
  canEdit: boolean;
  deletingAssetId?: string;
  imageUris: Record<string, string>;
  isLoading: boolean;
  isRecording: boolean;
  localAssets: ILocalReportAsset[];
  onAddDocument(): void;
  onAddPhoto(): void;
  onCancelRecording(): void;
  onRemoveLocalAsset(id: string): void;
  onOpenAsset(asset: IReportAsset): void;
  onRemoveServerAsset(asset: IReportAsset): void;
  onRetryRejectedAsset(id: string): void;
  onRetryUpload(id: string): void;
  onStartRecording(): void;
  onStopRecording(): void;
  onTakePhoto(): void;
  onToggleAudio(asset: IReportAsset): void;
  playback: {
    assetId?: string;
    durationSeconds: number;
    isPlaying: boolean;
    positionSeconds: number;
  };
  recordingDuration: number;
  retryingRejectedAssetId?: string;
}

export const AttachmentsSection = ({
  accessingAssetId,
  assets,
  canEdit,
  deletingAssetId,
  imageUris,
  isLoading,
  isRecording,
  localAssets,
  onAddDocument,
  onAddPhoto,
  onCancelRecording,
  onRemoveLocalAsset,
  onOpenAsset,
  onRemoveServerAsset,
  onRetryRejectedAsset,
  onRetryUpload,
  onStartRecording,
  onStopRecording,
  onTakePhoto,
  onToggleAudio,
  playback,
  recordingDuration,
  retryingRejectedAssetId,
}: IProps) => {
  const { colors, radius, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);
  const attachmentCount = assets.length + localAssets.length;
  const iconSize = scaleHorizontal(20);

  const getTypeIcon = (type: IReportAsset['type']) => {
    if (type === 'IMAGE') {
      return <PhotoIcon color={colors.primary} height={iconSize} width={iconSize} />;
    }
    if (type === 'AUDIO') {
      return <MicrophoneIcon color={colors.primary} height={iconSize} width={iconSize} />;
    }

    return <DocumentIcon color={colors.primary} height={iconSize} width={iconSize} />;
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Typography variant="heading">{t('reports.attachments.title')}</Typography>
        {attachmentCount > 0 ? (
          <Typography color={colors.textSecondary} variant="caption">
            {attachmentCount}
          </Typography>
        ) : null}
      </View>
      {canEdit ? (
        <View style={styles.addActions}>
          <Button
            leftElement={<PhotoIcon color={colors.primary} height={iconSize} width={iconSize} />}
            onPress={onAddPhoto}
            size="small"
            style={styles.addAction}
            title={String(t('reports.attachments.photo'))}
            variant="secondary"
          />
          <Button
            leftElement={<CameraIcon color={colors.primary} height={iconSize} width={iconSize} />}
            onPress={onTakePhoto}
            size="small"
            style={styles.addAction}
            title={String(t('reports.attachments.camera'))}
            variant="secondary"
          />
          <Button
            leftElement={<DocumentIcon color={colors.primary} height={iconSize} width={iconSize} />}
            onPress={onAddDocument}
            size="small"
            style={styles.addAction}
            title={String(t('reports.attachments.file'))}
            variant="secondary"
          />
          <Button
            leftElement={
              <MicrophoneIcon
                color={isRecording ? colors.textOnPrimary : colors.primary}
                height={iconSize}
                width={iconSize}
              />
            }
            onPress={isRecording ? onStopRecording : onStartRecording}
            size="small"
            style={styles.addAction}
            title={String(t(isRecording ? 'reports.attachments.stop' : 'reports.attachments.audio'))}
            variant={isRecording ? 'danger' : 'secondary'}
          />
        </View>
      ) : null}
      {isRecording ? (
        <View style={styles.recordingRow}>
          <Typography color={colors.error}>
            {t('reports.attachments.recording', { duration: formatAudioDuration(recordingDuration) })}
          </Typography>
          <Button onPress={onCancelRecording} size="small" title={String(t('common.cancel'))} variant="secondary" />
        </View>
      ) : null}
      {isLoading ? <Loader /> : null}
      {assets.length === 0 && localAssets.length === 0 && !isLoading ? (
        <Typography color={colors.textSecondary}>{t('reports.attachments.empty')}</Typography>
      ) : null}
      {assets.map((asset) => {
        const displayName = getReportAssetDisplayName(asset, {
          audioRecording: String(t('reports.attachments.audioRecordingName')),
          file: String(t('reports.attachments.fileName')),
          photo: String(t('reports.attachments.photoName')),
        });
        const rejectionDescription = String(
          t(`reports.attachments.rejectionReasons.${getReportAssetRejectionKey(asset.rejectionReason)}`),
        );

        return (
          <AttachmentCard
            asset={asset}
            canEdit={canEdit}
            deleting={deletingAssetId === asset.id}
            displayName={displayName}
            imageUri={imageUris[asset.id]}
            isAccessing={accessingAssetId === asset.id || retryingRejectedAssetId === asset.id}
            isPlaying={playback.assetId === asset.id && playback.isPlaying}
            key={asset.id}
            onDelete={() => onRemoveServerAsset(asset)}
            onOpen={() => onOpenAsset(asset)}
            onRetry={() => onRetryRejectedAsset(asset.id)}
            onToggleAudio={() => onToggleAudio(asset)}
            playbackDurationSeconds={playback.assetId === asset.id ? playback.durationSeconds : 0}
            playbackPositionSeconds={playback.assetId === asset.id ? playback.positionSeconds : 0}
            rejectionDescription={rejectionDescription}
          />
        );
      })}
      {localAssets.map((asset) => (
        <View key={asset.id} style={[styles.assetCard, asset.status === 'FAILED' && styles.failedAssetCard]}>
          {asset.status === 'FAILED' ? (
            <View style={styles.typeIcon}>
              <ErrorIcon color={colors.error} height={iconSize} width={iconSize} />
            </View>
          ) : asset.type === 'IMAGE' ? (
            <Image source={{ uri: asset.uri }} style={styles.thumbnail} />
          ) : (
            <View style={styles.typeIcon}>{getTypeIcon(asset.type)}</View>
          )}
          <View style={styles.assetText}>
            <Typography ellipsizeMode="middle" numberOfLines={1}>
              {asset.displayName}
            </Typography>
            <Typography color={asset.status === 'FAILED' ? colors.error : colors.textSecondary} variant="caption">
              {formatFileSize(asset.size)} · {t(`reports.attachments.states.${asset.status}`)}
              {asset.status === 'UPLOADING' ? ` ${asset.progress}%` : ''}
            </Typography>
            {asset.status === 'UPLOADING' ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${asset.progress}%` }]} />
              </View>
            ) : null}
          </View>
          <View style={styles.itemActions}>
            {canEdit && asset.status === 'FAILED' ? (
              <Pressable
                accessibilityLabel={String(t('reports.attachments.retryAccessibility', { name: asset.displayName }))}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onRetryUpload(asset.id)}
                style={styles.iconButton}
              >
                <RetryIcon color={colors.primary} height={iconSize} width={iconSize} />
              </Pressable>
            ) : null}
            {canEdit && (asset.status === 'FAILED' || asset.status === 'LOCAL') ? (
              <Pressable
                accessibilityLabel={String(t('reports.attachments.deleteAccessibility', { name: asset.displayName }))}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onRemoveLocalAsset(asset.id)}
                style={styles.iconButton}
              >
                <TrashIcon color={colors.error} height={iconSize} width={iconSize} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
};
