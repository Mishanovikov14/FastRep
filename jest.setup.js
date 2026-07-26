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
  API_URL: 'http://localhost:3000',
}));
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);
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
  const {
    KeyboardAvoidingView,
    ScrollView,
    View,
  } = require('react-native');

  return {
    KeyboardAvoidingView,
    KeyboardAwareScrollView: React.forwardRef((props, ref) =>
      React.createElement(ScrollView, { ...props, ref }),
    ),
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
