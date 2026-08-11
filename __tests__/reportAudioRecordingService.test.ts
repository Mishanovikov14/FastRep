import RNFS from 'react-native-fs';
import Sound from 'react-native-nitro-sound';
import { request } from 'react-native-permissions';

import {
  cancelReportAudioRecording,
  requestMicrophonePermission,
  startReportAudioRecording,
  stopReportAudioRecording,
} from '@/entities/report/services/reportAudioRecordingService';

jest.mock('@/libs/logger/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

describe('report audio recording service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (request as jest.Mock).mockResolvedValue('granted');
    (Sound.startRecorder as jest.Mock).mockResolvedValue('/cache/recording.m4a');
    (Sound.stopRecorder as jest.Mock).mockResolvedValue('file:///cache/recording.m4a');
    (RNFS.stat as jest.Mock).mockResolvedValue({ size: 4096 });
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
  });

  it('requests microphone permission and records a real M4A candidate in cache', async () => {
    const onProgress = jest.fn();

    await expect(requestMicrophonePermission()).resolves.toBe(true);
    await startReportAudioRecording(onProgress);
    await expect(stopReportAudioRecording(12.5)).resolves.toMatchObject({
      durationSeconds: 12.5,
      mimeType: 'audio/x-m4a',
      ownership: 'APP_TEMPORARY',
      size: 4096,
      type: 'AUDIO',
      uri: 'file:///cache/recording.m4a',
    });
    expect(Sound.startRecorder).toHaveBeenCalledWith(
      expect.stringMatching(/^\/cache\/FastRep-recording-\d+\.m4a$/u),
      expect.objectContaining({ AudioEncodingBitRate: 128000, AudioSamplingRate: 44100 }),
    );
    expect(RNFS.stat).toHaveBeenCalledWith('/cache/recording.m4a');
    expect(RNFS.write).toHaveBeenCalledWith('/cache/recording.m4a', 'M4A ', 8, 'ascii');
  });

  it('returns false when microphone permission is denied', async () => {
    (request as jest.Mock).mockResolvedValue('denied');

    await expect(requestMicrophonePermission()).resolves.toBe(false);
    expect(Sound.startRecorder).not.toHaveBeenCalled();
  });

  it('removes the listener and any partial file when recording fails to start', async () => {
    (Sound.startRecorder as jest.Mock).mockRejectedValue(new Error('native start failed'));
    (RNFS.exists as jest.Mock).mockResolvedValue(true);

    await expect(startReportAudioRecording(jest.fn())).rejects.toMatchObject({ code: 'AUDIO_RECORDER_START_FAILED' });
    expect(Sound.removeRecordBackListener).toHaveBeenCalled();
    expect(RNFS.unlink).toHaveBeenCalledWith(expect.stringMatching(/^\/cache\/FastRep-recording-\d+\.m4a$/u));
  });

  it('removes the progress listener when the native stop operation fails', async () => {
    (Sound.stopRecorder as jest.Mock).mockRejectedValue(new Error('native stop failed'));

    await expect(stopReportAudioRecording(4)).rejects.toMatchObject({ code: 'AUDIO_RECORDER_STOP_FAILED' });
    expect(Sound.removeRecordBackListener).toHaveBeenCalled();
  });

  it('rejects missing or empty recorder output paths', async () => {
    (Sound.stopRecorder as jest.Mock).mockResolvedValue('');

    await expect(stopReportAudioRecording(1)).rejects.toMatchObject({ code: 'AUDIO_PATH_MISSING' });
  });

  it('accepts the native absolute recorder path format', async () => {
    (Sound.stopRecorder as jest.Mock).mockResolvedValue('/cache/recording.m4a');

    await expect(stopReportAudioRecording(3)).resolves.toMatchObject({
      ownership: 'APP_TEMPORARY',
      uri: 'file:///cache/recording.m4a',
    });
    expect(RNFS.stat).toHaveBeenCalledWith('/cache/recording.m4a');
  });

  it('rejects a recorder output that is not a real M4A container', async () => {
    (RNFS.read as jest.Mock).mockResolvedValueOnce('not-an-m');

    await expect(stopReportAudioRecording(3)).rejects.toMatchObject({ code: 'AUDIO_INVALID_OUTPUT' });
    expect(RNFS.stat).not.toHaveBeenCalled();
  });

  it('cleans an unreadable normalized output file', async () => {
    (RNFS.stat as jest.Mock).mockRejectedValue(new Error('stat failed'));
    (RNFS.exists as jest.Mock).mockResolvedValue(true);

    await expect(stopReportAudioRecording(4)).rejects.toMatchObject({ code: 'AUDIO_FILE_UNREADABLE' });
    expect(RNFS.stat).toHaveBeenCalledWith('/cache/recording.m4a');
    expect(RNFS.unlink).toHaveBeenCalledWith('/cache/recording.m4a');
  });

  it('cleans an empty recorder output file', async () => {
    (RNFS.stat as jest.Mock).mockResolvedValue({ size: 0 });
    (RNFS.exists as jest.Mock).mockResolvedValue(true);

    await expect(stopReportAudioRecording(4)).rejects.toMatchObject({ code: 'AUDIO_FILE_UNREADABLE' });
    expect(RNFS.unlink).toHaveBeenCalledWith('/cache/recording.m4a');
  });

  it('removes an active temporary recording on cancellation', async () => {
    await startReportAudioRecording(jest.fn());
    (RNFS.exists as jest.Mock).mockResolvedValue(true);

    await cancelReportAudioRecording();

    expect(RNFS.unlink).toHaveBeenCalledWith(expect.stringMatching(/^\/cache\/FastRep-recording-\d+\.m4a$/u));
  });
});
