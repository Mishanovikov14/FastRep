module.exports = function (api) {
  const isProduction = api.env('production');

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
          extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.js', '.jsx'],
        },
      ],
      ...(isProduction ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : []),
      'react-native-worklets/plugin',
    ],
  };
};
