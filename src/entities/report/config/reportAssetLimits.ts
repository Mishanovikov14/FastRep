export const MEBIBYTE = 1024 * 1024;

export const reportAssetLimits = {
  audioMaxBytes: 50 * MEBIBYTE,
  audioMaxDurationSeconds: 1_200,
  documentMaxBytes: 25 * MEBIBYTE,
  imageMaxBytes: 10 * MEBIBYTE,
  imageMaxHeight: 4_096,
  imageMaxWidth: 4_096,
  reportMaxAudioFiles: 5,
  reportMaxDocuments: 10,
  reportMaxImages: 20,
  reportMaxTotalAssetBytes: 150 * MEBIBYTE,
} as const;

export const supportedAssetMimeTypes = {
  AUDIO: ['audio/mpeg', 'audio/x-m4a', 'audio/wav'],
  DOCUMENT: [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
} as const;
