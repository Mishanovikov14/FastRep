import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, RawAxiosHeaders } from 'axios';
import { AxiosHeaders } from 'axios';

import { AxiosRequester } from '@/libs/requester';

jest.mock('@/localization/i18n', () => ({
  i18n: {
    language: 'fr',
  },
}));

interface SuccessPayload {
  id: number;
}

const createClient = () => {
  const request = jest.fn();
  const client = { request } as unknown as AxiosInstance;

  return {
    client,
    request,
  };
};

describe('AxiosRequester', () => {
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

  it('resolves the active base URL for every request after an environment switch', async () => {
    const { client, request } = createClient();
    let baseUrl = 'https://api.fastrep.app';
    request.mockResolvedValue({
      data: { id: 7 },
    });
    const environmentCallbacks = {
      getBaseUrl: () => baseUrl,
    };
    const dynamicRequester = new AxiosRequester(client, undefined, environmentCallbacks);

    await dynamicRequester.request({ requiresAuth: false, url: '/health' });
    baseUrl = 'https://fastrep-api-development.up.railway.app';
    await dynamicRequester.request({ requiresAuth: false, url: '/health' });

    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        baseURL: 'https://api.fastrep.app',
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        baseURL: 'https://fastrep-api-development.up.railway.app',
      }),
    );
  });

  it('does not send old environment tokens while an environment switch is active', async () => {
    const { client, request } = createClient();
    const switchingRequester = new AxiosRequester(
      client,
      {
        getAuthState: async () => ({
          accessToken: 'old-environment-token',
          version: 3,
        }),
      },
      {
        getBaseUrl: () => {
          throw new Error('Environment switch in progress');
        },
      },
    );

    const result = await switchingRequester.request({ url: '/reports' });

    expect(request).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
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

  it('preserves registration cooldown metadata from backend errors', async () => {
    const { client, request } = createClient();
    request.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed',
      response: {
        data: {
          code: 'REGISTRATION_CODE_COOLDOWN',
          message: 'Please wait before requesting another registration code',
          retryAfterSeconds: 42,
        },
        status: 429,
      },
    });

    const result = await new AxiosRequester(client).request({ url: '/auth/resend-registration-code' });

    expect(result).toMatchObject({
      code: 'REGISTRATION_CODE_COOLDOWN',
      isError: true,
      retryAfterSeconds: 42,
      status: 429,
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
