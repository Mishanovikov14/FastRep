/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-mmkv', () => {
  const values = new Map();

  return {
    createMMKV: () => ({
      clearAll: () => values.clear(),
      contains: (key) => values.has(key),
      getString: (key) => {
        const value = values.get(key);

        return typeof value === 'string' ? value : undefined;
      },
      remove: (key) => values.delete(key),
      set: (key, value) => values.set(key, value),
    }),
  };
});
jest.mock('react-native-config', () => ({
  API_URL: 'https://api.fastrep.app',
}));
jest.mock('react-native-device-info', () => require('react-native-device-info/jest/react-native-device-info-mock'));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  },
}));
jest.mock('@react-native-documents/picker', () => ({
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: (error) => typeof error === 'object' && error !== null && 'code' in error,
  keepLocalCopy: jest.fn(),
  pick: jest.fn(),
}));
jest.mock('react-native-image-picker', () => ({ launchCamera: jest.fn(), launchImageLibrary: jest.fn() }));
jest.mock('react-native-nitro-sound', () => ({
  __esModule: true,
  AudioEncoderAndroidType: { AAC: 3 },
  AudioSourceAndroidType: { MIC: 1 },
  AVEncoderAudioQualityIOSType: { high: 96 },
  OutputFormatAndroidType: { MPEG_4: 2 },
  default: {
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    setSubscriptionDuration: jest.fn(),
    startRecorder: jest.fn(),
    stopRecorder: jest.fn(),
  },
}));
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: { ANDROID: { CAMERA: 'camera', RECORD_AUDIO: 'record_audio' }, IOS: { CAMERA: 'camera', MICROPHONE: 'microphone' } },
  request: jest.fn(async () => 'granted'),
  RESULTS: { GRANTED: 'granted', LIMITED: 'limited' },
}));
jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    CachesDirectoryPath: '/cache',
    downloadFile: jest.fn(() => ({ promise: Promise.resolve({ statusCode: 200 }) })),
    exists: jest.fn(async () => false),
    readDir: jest.fn(async () => []),
    stat: jest.fn(async () => ({ size: 1 })),
    unlink: jest.fn(async () => undefined),
  },
}));
jest.mock('react-native-file-viewer', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('react-native-share', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('uuid', () => ({ v4: jest.fn(() => '00000000-0000-4000-8000-000000000001') }));
jest.mock('react-native-localize', () => ({
  getLocales: () => [
    {
      countryCode: 'US',
      isRTL: false,
      languageCode: 'en',
      languageTag: 'en-US',
    },
  ],
}));
jest.mock('react-native-keyboard-controller', () => {
  const React = require('react');
  const { KeyboardAvoidingView, ScrollView, View } = require('react-native');

  return {
    KeyboardAvoidingView,
    KeyboardAwareScrollView: React.forwardRef((props, ref) => React.createElement(ScrollView, { ...props, ref })),
    KeyboardProvider: ({ children }) => children,
    KeyboardStickyView: View,
  };
});
jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');

  return View;
});
jest.mock('react-native-toast-message', () => {
  const React = require('react');
  const { View } = require('react-native');

  function BaseToast(props) {
    return React.createElement(View, props);
  }

  function Toast() {
    return React.createElement(View, { testID: 'toast-host' });
  }

  Toast.hide = jest.fn();
  Toast.show = jest.fn();

  return {
    __esModule: true,
    BaseToast,
    default: Toast,
  };
});
