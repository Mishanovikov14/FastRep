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

const getRecordingPath = (): string => `${RNFS.CachesDirectoryPath}/FastRep-recording-${Date.now()}.m4a`;

let activeRecordingPath: string | undefined;

export const requestMicrophonePermission = async (): Promise<boolean> => {
  const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;
  const result = await request(permission);

  return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
};

export const startReportAudioRecording = async (onProgress: (seconds: number) => void): Promise<void> => {
  activeRecordingPath = getRecordingPath();
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
};

export const stopReportAudioRecording = async (durationSeconds: number): Promise<IReportAssetCandidate> => {
  const path = await Sound.stopRecorder();
  Sound.removeRecordBackListener();
  const normalizedPath = path.replace('file://', '') || activeRecordingPath;

  if (!normalizedPath) {
    throw new Error('recording_path_missing');
  }

  const stat = await RNFS.stat(normalizedPath);
  activeRecordingPath = undefined;

  return {
    durationSeconds,
    fileName: `recording-${Date.now()}.m4a`,
    mimeType: 'audio/x-m4a',
    size: Number(stat.size),
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

  if (activeRecordingPath && (await RNFS.exists(activeRecordingPath))) {
    await RNFS.unlink(activeRecordingPath);
  }

  activeRecordingPath = undefined;
};
