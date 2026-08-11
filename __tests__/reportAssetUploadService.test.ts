import { uploadReportAssetToStorage } from '@/entities/report/services/reportAssetUploadService';

jest.mock('@/libs/logger/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

class MockXMLHttpRequest {
  static autoLoad = true;
  static instance: MockXMLHttpRequest;
  status = 204;
  timeout = 0;
  upload = { onprogress: jest.fn() };
  onerror = jest.fn();
  onload = jest.fn();
  ontimeout = jest.fn();
  open = jest.fn();
  send = jest.fn((_body?: unknown) => {
    if (MockXMLHttpRequest.autoLoad) {
      this.onload();
    }
  });
  setRequestHeader = jest.fn();

  constructor() {
    MockXMLHttpRequest.instance = this;
  }
}

describe('direct report asset upload', () => {
  it('posts directly to the presigned URL without the FastRep requester', async () => {
    const previous = globalThis.XMLHttpRequest;
    const runtimeGlobal = globalThis as unknown as { FormData: typeof FormData };
    const previousFormData = runtimeGlobal.FormData;
    class MockFormData {
      parts: Array<[string, unknown]> = [];

      append(name: string, value: unknown) {
        this.parts.push([name, value]);
      }
    }

    globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
    runtimeGlobal.FormData = MockFormData as unknown as typeof FormData;
    const onProgress = jest.fn();

    await uploadReportAssetToStorage({
      contract: { fields: { key: 'private/key', policy: 'signed-policy' }, method: 'POST', url: 'https://storage.test' },
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      onProgress,
      uri: 'file:///photo.jpg',
    });

    expect(MockXMLHttpRequest.instance.open).toHaveBeenCalledWith('POST', 'https://storage.test');
    expect(MockXMLHttpRequest.instance.send).toHaveBeenCalledWith(expect.any(FormData));
    expect(MockXMLHttpRequest.instance.setRequestHeader).not.toHaveBeenCalled();
    expect(MockXMLHttpRequest.instance.timeout).toBe(120000);
    expect(onProgress).toHaveBeenLastCalledWith(100);

    const body = MockXMLHttpRequest.instance.send.mock.calls[0][0] as unknown as FormData & {
      parts: Array<[string, unknown]>;
    };
    expect(body.parts.map(([fieldName]) => fieldName)).toEqual(['key', 'policy', 'file']);
    expect(body.parts[2][1]).toMatchObject({ name: 'photo.jpg', type: 'image/jpeg', uri: 'file:///photo.jpg' });
    globalThis.XMLHttpRequest = previous;
    runtimeGlobal.FormData = previousFormData;
  });

  it('reports progress and rejects timeout and non-success storage responses', async () => {
    const previous = globalThis.XMLHttpRequest;
    globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
    const onProgress = jest.fn();
    const input = {
      contract: { fields: { key: 'private/key' }, method: 'POST' as const, url: 'https://storage.test' },
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      onProgress,
      uri: 'file:///photo.jpg',
    };

    MockXMLHttpRequest.autoLoad = false;
    const timeoutOperation = uploadReportAssetToStorage(input);
    MockXMLHttpRequest.instance.upload.onprogress({ lengthComputable: true, loaded: 5, total: 10 });
    MockXMLHttpRequest.instance.ontimeout();
    await expect(timeoutOperation).rejects.toMatchObject({ failureType: 'timeout_error' });
    expect(onProgress).toHaveBeenCalledWith(50);

    const statusOperation = uploadReportAssetToStorage(input);
    MockXMLHttpRequest.instance.status = 403;
    MockXMLHttpRequest.instance.onload();
    await expect(statusOperation).rejects.toMatchObject({ failureType: 'http_error', httpStatus: 403 });

    const networkOperation = uploadReportAssetToStorage(input);
    MockXMLHttpRequest.instance.onerror();
    await expect(networkOperation).rejects.toMatchObject({ failureType: 'network_error' });

    MockXMLHttpRequest.autoLoad = true;
    globalThis.XMLHttpRequest = previous;
  });
});
