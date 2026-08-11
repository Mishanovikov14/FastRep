import { pick } from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { Asset } from 'react-native-image-picker';

import { reportAssetLimits, supportedAssetMimeTypes } from '@/entities/report/config/reportAssetLimits';
import { sanitizeAssetFileName } from '@/entities/report/model/reportAssetValidation';
import type { IReportAssetCandidate } from '@/entities/report/types/reportAsset';

const extensionByMimeType: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-m4a': 'm4a',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/csv': 'csv',
  'text/plain': 'txt',
};

const toImageCandidate = (asset: Asset): IReportAssetCandidate | undefined => {
  if (!asset.uri || !asset.type || !asset.fileSize) {
    return undefined;
  }

  const mimeType = asset.type.toLowerCase();
  const extension = extensionByMimeType[mimeType] ?? 'jpg';

  return {
    fileName: sanitizeAssetFileName(asset.fileName ?? `photo-${Date.now()}.${extension}`, extension),
    height: asset.height,
    mimeType,
    size: asset.fileSize,
    type: 'IMAGE',
    uri: asset.uri,
    width: asset.width,
  };
};

const imageOptions = {
  assetRepresentationMode: 'compatible' as const,
  maxHeight: reportAssetLimits.imageMaxHeight,
  maxWidth: reportAssetLimits.imageMaxWidth,
  mediaType: 'photo' as const,
  quality: 0.9 as const,
  restrictMimeTypes: [...supportedAssetMimeTypes.IMAGE],
  selectionLimit: 1,
};

export const pickReportImage = async (source: 'camera' | 'library'): Promise<IReportAssetCandidate | undefined> => {
  const response = source === 'camera' ? await launchCamera(imageOptions) : await launchImageLibrary(imageOptions);

  if (response.didCancel) {
    return undefined;
  }

  if (response.errorCode) {
    throw new Error(response.errorCode);
  }

  return response.assets?.[0] ? toImageCandidate(response.assets[0]) : undefined;
};

export const pickReportDocument = async (): Promise<IReportAssetCandidate | undefined> => {
  const [document] = await pick({
    allowMultiSelection: false,
    mode: 'import',
    type: [...supportedAssetMimeTypes.DOCUMENT],
  });

  if (!document.uri || !document.name || !document.type || !document.size) {
    return undefined;
  }

  const mimeType = document.type.toLowerCase();
  const extension = extensionByMimeType[mimeType] ?? 'bin';

  return {
    fileName: sanitizeAssetFileName(document.name, extension),
    mimeType,
    size: document.size,
    type: 'DOCUMENT',
    uri: document.uri,
  };
};
