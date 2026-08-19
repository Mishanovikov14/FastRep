import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Sound, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
} from 'react-native-nitro-sound';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

import { ReportAttachmentError } from '@/entities/report/model/ReportAttachmentError';
import {
  getUriScheme,
  logAttachmentStage,
} from '@/entities/report/services/reportAttachmentDiagnostics';
import {
  cleanupOwnedLocalFile,
  getReadableLocalFileSize,
  normalizeLocalFilePath,
} from '@/entities/report/services/reportLocalFileService';
import type { IReportAssetCandidate } from '@/entities/report/types/reportAsset';
import { logger } from '@/libs/logger/logger';

const getRecordingPath = (): string => `${RNFS.CachesDirectoryPath}/FastRep-recording-${Date.now()}.m4a`;

let activeRecordingPath: string | undefined;

const normalizeM4AContainerBrand = async (path: string): Promise<void> => {
  try {
    const fileTypeHeader = await RNFS.read(path, 8, 4, 'ascii');

    if (!fileTypeHeader.startsWith('ftyp')) {
      throw new Error('invalid_container');
    }

    const majorBrand = fileTypeHeader.slice(4, 8);

    if (majorBrand === 'mp42' || majorBrand === 'isom') {
      await RNFS.write(path, 'M4A ', 8, 'ascii');
    }

    const normalizedBrand = await RNFS.read(path, 4, 8, 'ascii');
    if (normalizedBrand !== 'M4A ') {
      throw new Error('invalid_m4a_brand');
    }
  } catch {
    throw new ReportAttachmentError('AUDIO', 'AUDIO_INVALID_OUTPUT', 'FILE_NORMALIZATION');
  }
};

const cleanupRecordingFile = async (path: string): Promise<void> => {
  try {
    await cleanupOwnedLocalFile(path, 'APP_TEMPORARY');
  } catch {
    logger.warn('report.temporary_asset_cleanup_failed', {
      assetType: 'AUDIO',
      errorCode: 'AUDIO_FILE_UNREADABLE',
      uriScheme: getUriScheme(path),
    });
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  logAttachmentStage('AUDIO', 'PERMISSION_REQUEST', { platform: Platform.OS });
  const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
  const result = await request(permission);

  return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
};

export const startReportAudioRecording = async (onProgress: (seconds: number) => void): Promise<void> => {
  const recordingPath = getRecordingPath();
  activeRecordingPath = recordingPath;
  logAttachmentStage('AUDIO', 'RECORDER_START', { platform: Platform.OS });

  try {
    Sound.setSubscriptionDuration(0.25);
    Sound.addRecordBackListener((metadata) => onProgress(metadata.currentPosition / 1_000));
    await Sound.startRecorder(recordingPath, {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioEncodingBitRate: 128_000,
      AudioSamplingRate: 44_100,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVFormatIDKeyIOS: 'aac',
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    });
    logAttachmentStage('AUDIO', 'RECORDING', { platform: Platform.OS });
  } catch {
    Sound.removeRecordBackListener();
    await cleanupRecordingFile(recordingPath);
    activeRecordingPath = undefined;
    throw new ReportAttachmentError('AUDIO', 'AUDIO_RECORDER_START_FAILED', 'RECORDER_START');
  }
};

export const stopReportAudioRecording = async (durationSeconds: number): Promise<IReportAssetCandidate> => {
  logAttachmentStage('AUDIO', 'RECORDER_STOP', { platform: Platform.OS });
  let returnedPath: string;

  try {
    returnedPath = await Sound.stopRecorder();
  } catch {
    if (activeRecordingPath) {
      await cleanupRecordingFile(activeRecordingPath);
    }
    activeRecordingPath = undefined;
    throw new ReportAttachmentError('AUDIO', 'AUDIO_RECORDER_STOP_FAILED', 'RECORDER_STOP');
  } finally {
    Sound.removeRecordBackListener();
  }

  const path = returnedPath || activeRecordingPath;

  if (!path) {
    activeRecordingPath = undefined;
    throw new ReportAttachmentError('AUDIO', 'AUDIO_PATH_MISSING', 'RECORDER_STOP');
  }

  logAttachmentStage('AUDIO', 'FILE_NORMALIZATION', {
    platform: Platform.OS,
    uriScheme: getUriScheme(path),
  });
  let normalizedPath: string;

  try {
    normalizedPath = normalizeLocalFilePath(path);
    await normalizeM4AContainerBrand(normalizedPath);
  } catch {
    await cleanupRecordingFile(path);
    activeRecordingPath = undefined;
    throw new ReportAttachmentError('AUDIO', 'AUDIO_INVALID_OUTPUT', 'FILE_NORMALIZATION');
  }

  logAttachmentStage('AUDIO', 'FILE_STAT', { platform: Platform.OS, uriScheme: 'file' });
  let size: number;

  try {
    size = await getReadableLocalFileSize(normalizedPath);
  } catch {
    await cleanupRecordingFile(normalizedPath);
    activeRecordingPath = undefined;
    throw new ReportAttachmentError('AUDIO', 'AUDIO_FILE_UNREADABLE', 'FILE_STAT');
  }

  activeRecordingPath = undefined;

  return {
    durationSeconds,
    fileName: `recording-${Date.now()}.m4a`,
    mimeType: 'audio/x-m4a',
    ownership: 'APP_TEMPORARY',
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
  logAttachmentStage('AUDIO', 'RECORDER_STOP', { platform: Platform.OS, status: 'cancelled' });
};
