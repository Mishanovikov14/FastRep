import type { IReportAsset, IReportAssetCandidate } from '@/entities/report/types/reportAsset';

interface IAssetDisplayLabels {
  audioRecording: string;
  file: string;
  photo: string;
}

const INVALID_FILENAME_CHARACTERS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
const TECHNICAL_NAME_PATTERNS = [
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/iu,
  /(?:^|[-_])\d{10,}(?:[-_.]|$)/u,
  /^(?:attachment|photo|recording|rn[-_]image[-_]picker)[-_]/iu,
];

const getExtension = (fileName: string): string => {
  return fileName.match(/(\.[\p{L}\p{N}]{1,10})$/u)?.[1]?.toLowerCase() ?? '';
};

export const sanitizeAttachmentDisplayName = (fileName: string): string => {
  return Array.from(fileName.normalize('NFC'))
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;

      return codePoint > 31 && codePoint !== 127 && !INVALID_FILENAME_CHARACTERS.has(character);
    })
    .join('')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/[. ]+$/gu, '')
    .slice(0, 255);
};

export const isTechnicalDisplayName = (fileName: string): boolean => {
  return TECHNICAL_NAME_PATTERNS.some((pattern) => pattern.test(fileName));
};

export const getReportAssetDisplayName = (
  asset: Pick<IReportAsset, 'originalFileName' | 'position' | 'type'>,
  labels: IAssetDisplayLabels,
): string => {
  const ordinal = asset.position + 1;

  if (asset.type === 'IMAGE') {
    return `${labels.photo} ${ordinal}`;
  }

  if (asset.type === 'AUDIO') {
    return `${labels.audioRecording} ${ordinal}`;
  }

  const displayName = sanitizeAttachmentDisplayName(asset.originalFileName);
  if (displayName && !isTechnicalDisplayName(displayName)) {
    return displayName;
  }

  return `${labels.file} ${ordinal}${getExtension(displayName)}`;
};

export const getLocalReportAssetDisplayName = (
  candidate: IReportAssetCandidate,
  ordinal: number,
  labels: IAssetDisplayLabels,
): string => {
  if (candidate.type === 'IMAGE') {
    return `${labels.photo} ${ordinal}`;
  }

  if (candidate.type === 'AUDIO') {
    return `${labels.audioRecording} ${ordinal}`;
  }

  const displayName = sanitizeAttachmentDisplayName(candidate.displayName ?? candidate.fileName);
  if (displayName && !isTechnicalDisplayName(displayName)) {
    return displayName;
  }

  return `${labels.file} ${ordinal}${getExtension(displayName)}`;
};

export const getReportDisplayTitle = (title: string, fallback: string): string => {
  const normalized = title.replace(/\s+/gu, ' ').trim();

  if (!normalized || isTechnicalDisplayName(normalized) || /^\d+$/u.test(normalized) || /^untitled[-_\s]?\d*/iu.test(normalized)) {
    return fallback;
  }

  return normalized;
};
