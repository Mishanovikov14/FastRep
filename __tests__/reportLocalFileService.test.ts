import RNFS from 'react-native-fs';

import {
  cleanupOwnedLocalFile,
  getReadableLocalFileSize,
  normalizeLocalFilePath,
} from '@/entities/report/services/reportLocalFileService';

describe('report local file service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
    (RNFS.stat as jest.Mock).mockResolvedValue({ size: 4096 });
  });

  it('normalizes encoded file URIs while preserving spaces and Unicode paths', () => {
    expect(normalizeLocalFilePath('file:///cache/%D0%9E%D0%B3%D0%BB%D1%8F%D0%B4%20%D0%B4%D0%B0%D1%85%D1%83.pdf')).toBe(
      '/cache/Огляд даху.pdf',
    );
    expect(normalizeLocalFilePath('/cache/Огляд даху.pdf')).toBe('/cache/Огляд даху.pdf');
  });

  it('rejects unsupported provider schemes instead of passing them to RNFS', async () => {
    expect(() => normalizeLocalFilePath('content://provider/document/1')).toThrow('URI_UNSUPPORTED');
    await expect(getReadableLocalFileSize('content://provider/document/1')).rejects.toMatchObject({
      code: 'URI_UNSUPPORTED',
    });
    expect(RNFS.stat).not.toHaveBeenCalled();
  });

  it('never deletes system-owned picker files and cleans app-owned temporary files', async () => {
    await expect(cleanupOwnedLocalFile('file:///cache/gallery.jpg', 'SYSTEM_OWNED')).resolves.toBe(false);
    expect(RNFS.exists).not.toHaveBeenCalled();
    expect(RNFS.unlink).not.toHaveBeenCalled();

    await expect(cleanupOwnedLocalFile('file:///cache/document.pdf', 'APP_TEMPORARY')).resolves.toBe(true);
    expect(RNFS.unlink).toHaveBeenCalledWith('/cache/document.pdf');
  });
});
