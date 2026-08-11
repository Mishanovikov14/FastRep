import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Sound, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
} from 'react-native-nitro-sound';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

import type { IReportAssetCandidate } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';

const getRecordingPath = (): string => `${RNFS.CachesDirectoryPath}/FastRep-recording-${Date.now()}.m4a`;

let activeRecordingPath: string | undefined;

const cleanupRecordingFile = async (path: string): Promise<void> => {
  try {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  } catch {
    logger.warn('report.audio_recording_cleanup_failed', { assetType: 'AUDIO', uriScheme: 'file' });
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
  const result = await request(permission);
  const isGranted = result === RESULTS.GRANTED || result === RESULTS.LIMITED;

  logger.debug('report.audio_permission_result', {
    assetType: 'AUDIO',
    platform: Platform.OS,
    source: isGranted ? 'granted' : 'denied',
  });

  return isGranted;
};

export const startReportAudioRecording = async (onProgress: (seconds: number) => void): Promise<void> => {
  const recordingPath = getRecordingPath();
  activeRecordingPath = recordingPath;
  logger.debug('report.audio_recording_starting', { assetType: 'AUDIO', platform: Platform.OS });

  try {
    Sound.setSubscriptionDuration(0.25);
    Sound.addRecordBackListener((metadata) => onProgress(metadata.currentPosition / 1_000));
    await Sound.startRecorder(activeRecordingPath, {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioEncodingBitRate: 128_000,
      AudioSamplingRate: 44_100,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVFormatIDKeyIOS: 'aac',
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    });
    logger.info('report.audio_recording_started', { assetType: 'AUDIO', platform: Platform.OS });
  } catch {
    Sound.removeRecordBackListener();
    await cleanupRecordingFile(recordingPath);
    activeRecordingPath = undefined;
    logger.error('report.audio_recording_start_failed', { assetType: 'AUDIO', platform: Platform.OS });
    throw new Error('recording_start_failed');
  }
};

export const stopReportAudioRecording = async (durationSeconds: number): Promise<IReportAssetCandidate> => {
  let path: string;

  try {
    path = await Sound.stopRecorder();
  } finally {
    Sound.removeRecordBackListener();
  }

  const normalizedPath = path.startsWith('file://') ? decodeURI(path.slice('file://'.length)) : path || activeRecordingPath;

  if (!normalizedPath) {
    logger.error('report.audio_recording_stop_failed', { assetType: 'AUDIO', errorCode: 'recording_path_missing' });
    throw new Error('recording_path_missing');
  }

  let size: number;

  try {
    logger.debug('report.audio_file_stat_started', { assetType: 'AUDIO', uriScheme: 'file' });
    const stat = await RNFS.stat(normalizedPath);
    size = Number(stat.size);
  } catch {
    await cleanupRecordingFile(normalizedPath);
    activeRecordingPath = undefined;
    logger.error('report.audio_recording_stop_failed', { assetType: 'AUDIO', errorCode: 'recording_file_unreadable' });
    throw new Error('recording_file_unreadable');
  }

  if (!Number.isFinite(size) || size <= 0) {
    await cleanupRecordingFile(normalizedPath);
    activeRecordingPath = undefined;
    logger.error('report.audio_recording_stop_failed', { assetType: 'AUDIO', errorCode: 'recording_file_empty' });
    throw new Error('recording_file_empty');
  }

  activeRecordingPath = undefined;

  logger.info('report.audio_recording_stopped', {
    assetType: 'AUDIO',
    durationSeconds,
    mimeType: 'audio/x-m4a',
    size,
    uriScheme: 'file',
  });

  return {
    durationSeconds,
    fileName: `recording-${Date.now()}.m4a`,
    mimeType: 'audio/x-m4a',
    size,
    type: 'AUDIO',
    uri: `file://${normalizedPath}`,
  };
};

export const cancelReportAudioRecording = async (): Promise<void> => {
  try {
    await Sound.stopRecorder();
  } catch {
    // The recorder may already be stopped.
  }

  Sound.removeRecordBackListener();

  if (activeRecordingPath) {
    await cleanupRecordingFile(activeRecordingPath);
  }

  activeRecordingPath = undefined;
  logger.debug('report.audio_recording_cancelled', { assetType: 'AUDIO' });
};
