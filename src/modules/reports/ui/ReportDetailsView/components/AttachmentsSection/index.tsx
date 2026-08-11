import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { formatAudioDuration, formatFileSize } from '@/entities/report/model/reportAssetValidation';
import type { ILocalReportAsset, IReportAsset } from '@/entities/report/types/reportAsset';
import { Button } from '@/UIKit/Button';
import { Loader } from '@/UIKit/Loader';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

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

  return (
    <View style={styles.section}>
      <Typography variant="heading">{t('reports.attachments.title')}</Typography>
      {canEdit ? (
        <View style={styles.addActions}>
          <Button onPress={onAddPhoto} size="small" title={String(t('reports.attachments.photo'))} variant="secondary" />
          <Button onPress={onTakePhoto} size="small" title={String(t('reports.attachments.camera'))} variant="secondary" />
          <Button onPress={onAddDocument} size="small" title={String(t('reports.attachments.file'))} variant="secondary" />
          <Button
            onPress={isRecording ? onStopRecording : onStartRecording}
            size="small"
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
            <View style={styles.typeBadge}>
              <Typography color={colors.primary} variant="caption">
                {t(`reports.attachments.types.${asset.type}`)}
              </Typography>
            </View>
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
          {asset.type === 'IMAGE' ? <Image source={{ uri: asset.uri }} style={styles.thumbnail} /> : null}
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
