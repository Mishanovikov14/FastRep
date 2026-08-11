import {
  getReportAssetDisplayName,
  getReportDisplayTitle,
} from '@/entities/report/model/reportDisplayNames';
import type { IReportAsset } from '@/entities/report/types/reportAsset';

const labels = { audioRecording: 'Audio recording', file: 'File', photo: 'Photo' };

const createAsset = (overrides: Partial<IReportAsset>): IReportAsset => ({
  createdAt: '2026-08-11T10:00:00.000Z',
  declaredMimeType: 'application/pdf',
  declaredSize: 1024,
  id: 'asset-1',
  originalFileName: 'roof-inspection.pdf',
  position: 0,
  reportId: 'report-1',
  status: 'READY',
  type: 'DOCUMENT',
  updatedAt: '2026-08-11T10:00:00.000Z',
  ...overrides,
});

describe('report attachment display names', () => {
  it('uses friendly stable names for photos and audio based on persisted position', () => {
    const photo = createAsset({ originalFileName: '9f35cd21-2da4-49ae-a6c5-0be5240188bc.jpg', position: 2, type: 'IMAGE' });
    const audio = createAsset({ originalFileName: 'recording-1723467347437.m4a', position: 4, type: 'AUDIO' });

    expect(getReportAssetDisplayName(photo, labels)).toBe('Photo 3');
    expect(getReportAssetDisplayName(audio, labels)).toBe('Audio recording 5');
    expect(getReportAssetDisplayName({ ...photo }, labels)).toBe('Photo 3');
  });

  it('preserves a user document name and hides a technical fallback', () => {
    expect(getReportAssetDisplayName(createAsset({}), labels)).toBe('roof-inspection.pdf');
    expect(
      getReportAssetDisplayName(
        createAsset({ originalFileName: '9f35cd21-2da4-49ae-a6c5-0be5240188bc.pdf', position: 1 }),
        labels,
      ),
    ).toBe('File 2.pdf');
  });

  it('uses a human-readable report fallback without replacing a real title', () => {
    expect(getReportDisplayTitle('report-58f91672-0da4-49ae-a6c5-0be5240188bc', 'New report')).toBe('New report');
    expect(getReportDisplayTitle('1723462358234', 'New report')).toBe('New report');
    expect(getReportDisplayTitle('Roof inspection', 'New report')).toBe('Roof inspection');
  });
});
