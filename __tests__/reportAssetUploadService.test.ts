import { uploadReportAssetToStorage } from '@/entities/report/services/reportAssetUploadService';

class MockXMLHttpRequest {
  static instance: MockXMLHttpRequest;
  status = 204;
  timeout = 0;
  upload = { onprogress: jest.fn() };
  onerror = jest.fn();
  onload = jest.fn();
  ontimeout = jest.fn();
  open = jest.fn();
  send = jest.fn(() => this.onload());

  constructor() {
    MockXMLHttpRequest.instance = this;
  }
}

describe('direct report asset upload', () => {
  it('posts directly to the presigned URL without the FastRep requester', async () => {
    const previous = globalThis.XMLHttpRequest;
    globalThis.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
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
    expect(onProgress).toHaveBeenLastCalledWith(100);
    globalThis.XMLHttpRequest = previous;
  });
});
