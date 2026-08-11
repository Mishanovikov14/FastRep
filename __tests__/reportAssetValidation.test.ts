import { reportAssetLimits } from '@/entities/report/config/reportAssetLimits';
import {
  isSupportedAssetMimeType,
  sanitizeAssetFileName,
  validateReportAssetCandidate,
} from '@/entities/report/model/reportAssetValidation';
import type { IReportAssetCandidate } from '@/entities/report/types/reportAsset';

const image: IReportAssetCandidate = {
  fileName: 'photo.jpg',
  height: 1200,
  mimeType: 'image/jpeg',
  size: 1024,
  type: 'IMAGE',
  uri: 'file:///photo.jpg',
  width: 1600,
};

describe('report asset validation', () => {
  it('accepts supported normalized JPEG and rejects HEIC', () => {
    expect(isSupportedAssetMimeType('IMAGE', 'image/jpeg')).toBe(true);
    expect(isSupportedAssetMimeType('IMAGE', 'image/heic')).toBe(false);
    expect(validateReportAssetCandidate(image, [])).toBeUndefined();
    expect(validateReportAssetCandidate({ ...image, mimeType: 'image/heic' }, [])).toBe('unsupportedType');
  });

  it.each([
    ['IMAGE', 'image/jpeg', reportAssetLimits.imageMaxBytes],
    ['AUDIO', 'audio/x-m4a', reportAssetLimits.audioMaxBytes],
    ['DOCUMENT', 'application/pdf', reportAssetLimits.documentMaxBytes],
  ] as const)('enforces the %s file-size limit', (type, mimeType, maxBytes) => {
    expect(
      validateReportAssetCandidate(
        { fileName: 'file', mimeType, size: maxBytes + 1, type, uri: 'file:///file' },
        [],
      ),
    ).toBe('fileTooLarge');
  });

  it('rejects legacy documents and unsupported audio', () => {
    expect(isSupportedAssetMimeType('DOCUMENT', 'application/msword')).toBe(false);
    expect(isSupportedAssetMimeType('DOCUMENT', 'application/vnd.ms-excel')).toBe(false);
    expect(isSupportedAssetMimeType('AUDIO', 'audio/ogg')).toBe(false);
  });

  it('enforces dimensions, duration, counts, and aggregate bytes', () => {
    expect(validateReportAssetCandidate({ ...image, width: 4097 }, [])).toBe('imageDimensionsTooLarge');
    expect(
      validateReportAssetCandidate(
        {
          durationSeconds: reportAssetLimits.audioMaxDurationSeconds + 1,
          fileName: 'audio.m4a',
          mimeType: 'audio/x-m4a',
          size: 1024,
          type: 'AUDIO',
          uri: 'file:///audio.m4a',
        },
        [],
      ),
    ).toBe('audioDurationTooLong');

    const images = Array.from({ length: reportAssetLimits.reportMaxImages }, () => ({
      declaredSize: 1,
      type: 'IMAGE' as const,
    }));
    expect(validateReportAssetCandidate(image, images)).toBe('tooManyFiles');
    expect(
      validateReportAssetCandidate(image, [
        { declaredSize: reportAssetLimits.reportMaxTotalAssetBytes, type: 'DOCUMENT' },
      ]),
    ).toBe('reportTotalTooLarge');
  });

  it('sanitizes object-storage-facing filenames', () => {
    expect(sanitizeAssetFileName('../../My résumé?.pdf', 'pdf')).toBe('My-resume.pdf');
  });
});
