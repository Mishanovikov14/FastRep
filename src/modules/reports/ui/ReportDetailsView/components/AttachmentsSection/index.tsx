import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { CameraIcon } from '@/assets/icons/CameraIcon';
import { DocumentIcon } from '@/assets/icons/DocumentIcon';
import { MicrophoneIcon } from '@/assets/icons/MicrophoneIcon';
import { PhotoIcon } from '@/assets/icons/PhotoIcon';
import { formatAudioDuration, formatFileSize } from '@/entities/report/model/reportAssetValidation';
import type { ILocalReportAsset, IReportAsset } from '@/entities/report/types/reportAsset';
import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';
import { scaleHorizontal } from '@/utils/scaling';

import { getStyles } from './styles';

interface IProps {
  assets: IReportAsset[];
  canEdit: boolean;
  isLoading: boolean;
  isRecording: boolean;
  localAssets: ILocalReportAsset[];
  onAddDocument(): void;
  onAddPhoto(): void;
  onCancelRecording(): void;
  onRemoveLocalAsset(id: string): void;
  onRemoveServerAsset(id: string): void;
  onRetryUpload(id: string): void;
  onStartRecording(): void;
  onStopRecording(): void;
  onTakePhoto(): void;
  recordingDuration: number;
}

export const AttachmentsSection = ({
  assets,
  canEdit,
  isLoading,
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
      {assets.map((asset) => (
        <View key={asset.id} style={styles.assetCard}>
          <View style={styles.assetInfo}>
            <View style={styles.typeIcon}>{getTypeIcon(asset.type)}</View>
            <View style={styles.assetText}>
              <Typography numberOfLines={1}>{asset.originalFileName}</Typography>
              <Typography color={colors.textSecondary} variant="caption">
                {formatFileSize(asset.verifiedSize ?? asset.declaredSize)}
                {asset.durationSeconds ? ` · ${formatAudioDuration(asset.durationSeconds)}` : ''}
              </Typography>
            </View>
          </View>
          {canEdit ? (
            <Button
              onPress={() => onRemoveServerAsset(asset.id)}
              size="small"
              title={String(t('reports.attachments.remove'))}
              variant="secondary"
            />
          ) : null}
        </View>
      ))}
      {localAssets.map((asset) => (
        <View key={asset.id} style={styles.assetCard}>
          {asset.type === 'IMAGE' ? (
            <Image source={{ uri: asset.uri }} style={styles.thumbnail} />
          ) : (
            <View style={styles.typeIcon}>{getTypeIcon(asset.type)}</View>
          )}
          <View style={styles.assetText}>
            <Typography numberOfLines={1}>{asset.fileName}</Typography>
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
            {asset.status === 'FAILED' ? (
              <Button
                onPress={() => onRetryUpload(asset.id)}
                size="small"
                title={String(t('common.retry'))}
                variant="secondary"
              />
            ) : null}
            <Button
              disabled={asset.status !== 'FAILED' && asset.status !== 'LOCAL'}
              onPress={() => onRemoveLocalAsset(asset.id)}
              size="small"
              title={String(t('reports.attachments.remove'))}
              variant="secondary"
            />
          </View>
        </View>
      ))}
    </View>
  );
};
