import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, RawAxiosHeaders } from 'axios';
import { AxiosHeaders } from 'axios';

import { axiosClient, AxiosRequester } from '@/libs/requester';

jest.mock('@/localization', () => ({
  i18n: {
    language: 'fr',
  },
}));

interface SuccessPayload {
  id: number;
}

function createClient() {
  const request = jest.fn();
  const client = { request } as unknown as AxiosInstance;

  return {
    client,
    request,
  };
}

describe('AxiosRequester', () => {
  it('uses the configured API URL', () => {
    expect(axiosClient.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('maps a successful response to IResponse<T>', async () => {
    const { client, request } = createClient();
    const response: AxiosResponse<SuccessPayload> = {
      config: {
        headers: new AxiosHeaders(),
      },
      data: { id: 7 },
      headers: {},
      status: 200,
      statusText: 'OK',
    };
    request.mockResolvedValue(response);

    const result = await new AxiosRequester(client).request<SuccessPayload>({ url: '/health' });

    expect(result).toEqual({
      data: { id: 7 },
      isError: false,
      message: '',
    });
  });

  it('maps a backend error without throwing', async () => {
    const { client, request } = createClient();
    request.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed',
      response: {
        data: {
          errors: { email: ['Invalid'] },
          message: 'Validation failed',
          type: 'validation_error',
        },
        status: 422,
      },
    });

    const result = await new AxiosRequester(client).request({ url: '/test' });

    expect(result).toEqual({
      errors: { email: ['Invalid'] },
      isError: true,
      message: 'Validation failed',
      status: 422,
      type: 'validation_error',
    });
  });

  it.each([
    ['ERR_NETWORK', 'Network connection is unavailable.'],
    ['ECONNABORTED', 'The request timed out.'],
  ])('normalizes %s failures', async (code, expectedMessage) => {
    const { client, request } = createClient();
    request.mockRejectedValue({
      code,
      isAxiosError: true,
      message: 'Request failed',
    });

    const result = await new AxiosRequester(client).request({ url: '/test' });

    expect(result.isError).toBe(true);
    expect(result.message).toBe(expectedMessage);
  });

  it('adds the current locale header to every request', async () => {
    const { client, request } = createClient();
    request.mockResolvedValue({
      data: {},
    });

    await new AxiosRequester(client).request({ url: '/test' });

    const config = request.mock.calls[0]?.[0] as AxiosRequestConfig;
    const headers = AxiosHeaders.from(config.headers as RawAxiosHeaders | AxiosHeaders | undefined);

    expect(headers.get('X-Locale')).toBe('fr');
  });
});
