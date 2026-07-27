module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  plugins: ['import', 'simple-import-sort'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'off',
  },
};
