import { useMemo } from 'react';
import { Image, Pressable, View } from 'react-native';

import { DocumentIcon } from '@/assets/icons/DocumentIcon';
import { ErrorIcon } from '@/assets/icons/ErrorIcon';
import { MicrophoneIcon } from '@/assets/icons/MicrophoneIcon';
import { PauseIcon } from '@/assets/icons/PauseIcon';
import { PhotoIcon } from '@/assets/icons/PhotoIcon';
import { PlayIcon } from '@/assets/icons/PlayIcon';
import { RetryIcon } from '@/assets/icons/RetryIcon';
import { TrashIcon } from '@/assets/icons/TrashIcon';
import { formatAudioDuration, formatFileSize } from '@/entities/report/model/reportAssetValidation';
import type { IReportAsset } from '@/entities/report/types/reportAsset';
import { Loader } from '@/UIKit/Loader';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';
import { scaleHorizontal } from '@/utils/scaling';

import { getStyles } from './styles';

interface IProps {
  asset: IReportAsset;
  canEdit: boolean;
  deleting: boolean;
  displayName: string;
  imageUri?: string;
  isAccessing: boolean;
  isPlaying: boolean;
  onDelete(): void;
  onOpen(): void;
  onRetry(): void;
  onToggleAudio(): void;
  playbackDurationSeconds: number;
  playbackPositionSeconds: number;
  rejectionDescription?: string;
}

export const AttachmentCard = ({
  asset,
  canEdit,
  deleting,
  displayName,
  imageUri,
  isAccessing,
  isPlaying,
  onDelete,
  onOpen,
  onRetry,
  onToggleAudio,
  playbackDurationSeconds,
  playbackPositionSeconds,
  rejectionDescription,
}: IProps) => {
  const { colors, radius, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);
  const iconSize = scaleHorizontal(22);
  const isRejected = asset.status === 'REJECTED';
  const isPending = asset.status === 'PENDING_UPLOAD';
  const isAudio = asset.type === 'AUDIO';
  const durationSeconds = playbackDurationSeconds || asset.durationSeconds || 0;
  const progress = durationSeconds > 0 ? Math.min(100, (playbackPositionSeconds / durationSeconds) * 100) : 0;
  const typeIcon =
    asset.type === 'IMAGE' ? (
      <PhotoIcon color={isRejected ? colors.error : colors.primary} height={iconSize} width={iconSize} />
    ) : asset.type === 'AUDIO' ? (
      <MicrophoneIcon color={isRejected ? colors.error : colors.primary} height={iconSize} width={iconSize} />
    ) : (
      <DocumentIcon color={isRejected ? colors.error : colors.primary} height={iconSize} width={iconSize} />
    );

  return (
    <Pressable
      accessibilityLabel={displayName}
      accessibilityRole={isRejected || isAudio ? undefined : 'button'}
      disabled={isRejected || isPending || isAudio || isAccessing}
      onPress={onOpen}
      style={({ pressed }) => [styles.card, isRejected && styles.rejectedCard, pressed && styles.pressedCard]}
    >
      {imageUri && !isRejected ? (
        <Image accessibilityIgnoresInvertColors source={{ uri: imageUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.typeIcon, isRejected && styles.rejectedIcon]}>
          {isRejected ? <ErrorIcon color={colors.error} height={iconSize} width={iconSize} /> : typeIcon}
        </View>
      )}
      <View style={styles.content}>
        <Typography ellipsizeMode="middle" numberOfLines={1}>
          {displayName}
        </Typography>
        <Typography color={isRejected ? colors.error : colors.textSecondary} variant="caption">
          {isRejected
            ? rejectionDescription
            : isPending
              ? t('reports.attachments.states.CONFIRMING')
              : `${formatFileSize(asset.verifiedSize ?? asset.declaredSize)}${
                asset.durationSeconds ? ` · ${formatAudioDuration(asset.durationSeconds)}` : ''
              }`}
        </Typography>
        {isAudio && !isRejected ? (
          <>
            <View style={styles.audioProgressTrack}>
              <View style={[styles.audioProgressFill, { width: `${progress}%` }]} />
            </View>
            <Typography color={colors.textSecondary} variant="caption">
              {formatAudioDuration(playbackPositionSeconds)} / {formatAudioDuration(durationSeconds)}
            </Typography>
          </>
        ) : null}
      </View>
      <View style={styles.actions}>
        {isAccessing || deleting || isPending ? (
          <View style={styles.iconButton}>
            <Loader />
          </View>
        ) : null}
        {isAudio && asset.status === 'READY' && !isAccessing && !deleting ? (
          <Pressable
            accessibilityLabel={String(
              t(isPlaying ? 'reports.attachments.pauseAccessibility' : 'reports.attachments.playAccessibility', {
                name: displayName,
              }),
            )}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onToggleAudio}
            style={styles.iconButton}
          >
            {isPlaying ? (
              <PauseIcon color={colors.primary} height={iconSize} width={iconSize} />
            ) : (
              <PlayIcon color={colors.primary} height={iconSize} width={iconSize} />
            )}
          </Pressable>
        ) : null}
        {isRejected && canEdit && !isAccessing && !deleting ? (
          <Pressable
            accessibilityLabel={String(t('reports.attachments.retryAccessibility', { name: displayName }))}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onRetry}
            style={styles.iconButton}
          >
            <RetryIcon color={colors.primary} height={iconSize} width={iconSize} />
          </Pressable>
        ) : null}
        {canEdit && !deleting && !isAccessing ? (
          <Pressable
            accessibilityLabel={String(t('reports.attachments.deleteAccessibility', { name: displayName }))}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onDelete}
            style={styles.iconButton}
          >
            <TrashIcon color={colors.error} height={iconSize} width={iconSize} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
};
