import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, RawAxiosHeaders } from 'axios';
import { AxiosHeaders } from 'axios';

import { AxiosRequester } from '@/libs/requester/AxiosRequester';
import type { IRequesterAuthState } from '@/libs/requester/IRequester';

jest.mock('@/localization/i18n', () => ({
  i18n: {
    language: 'en',
  },
}));

interface SuccessPayload {
  url: string;
}

const createClient = () => {
  const request = jest.fn();
  const client = { request } as unknown as AxiosInstance;

  return {
    client,
    request,
  };
};

const createSuccessResponse = <T>(data: T): AxiosResponse<T> => {
  return {
    config: {
      headers: new AxiosHeaders(),
    },
    data,
    headers: {},
    status: 200,
    statusText: 'OK',
  };
};

const createAxiosError = (status: number) => {
  return {
    isAxiosError: true,
    message: `Request failed with status ${status}`,
    response: {
      data: {
        message: `Request failed with status ${status}`,
      },
      status,
    },
  };
};

const createAuthState = (
  accessToken: string | null,
  version = 0,
): IRequesterAuthState => {
  return {
    accessToken,
    version,
  };
};

const getRequestHeaders = (
  request: ReturnType<typeof createClient>['request'],
  callIndex: number,
): AxiosHeaders => {
  const config = request.mock.calls[callIndex]?.[0] as AxiosRequestConfig;

  return AxiosHeaders.from(config.headers as RawAxiosHeaders | AxiosHeaders | undefined);
};

describe('AxiosRequester authentication and refresh', () => {
  it('attaches the access token as a Bearer header to a protected request', async () => {
    const { client, request } = createClient();
    const getAuthState = jest.fn().mockResolvedValue(createAuthState('access-token'));
    request.mockResolvedValue(createSuccessResponse({ url: '/auth/me' }));

    await new AxiosRequester(client, { getAuthState }).request({
      url: '/auth/me',
    });

    expect(getAuthState).toHaveBeenCalledTimes(1);
    expect(getRequestHeaders(request, 0).get('Authorization')).toBe('Bearer access-token');
  });

  it.each([
    '/auth/login',
    '/auth/forgot-password',
    '/auth/reset-password',
  ])('keeps public endpoint %s free of Authorization and refresh', async (url) => {
    const { client, request } = createClient();
    const getAuthState = jest.fn().mockResolvedValue(createAuthState('access-token'));
    const refreshAuthState = jest
      .fn()
      .mockResolvedValue(createAuthState('new-access-token', 1));
    request.mockRejectedValue(createAxiosError(401));

    const result = await new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    }).request({
      headers: {
        Authorization: 'Bearer stale-token',
      },
      requiresAuth: false,
      skipAuthRefresh: true,
      url,
    });

    expect(result).toMatchObject({
      isError: true,
      status: 401,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(getAuthState).not.toHaveBeenCalled();
    expect(refreshAuthState).not.toHaveBeenCalled();
    expect(getRequestHeaders(request, 0).has('Authorization')).toBe(false);
  });

  it.each([400, 403])('does not refresh a protected request after status %s', async (status) => {
    const { client, request } = createClient();
    const getAuthState = jest.fn().mockResolvedValue(createAuthState('access-token'));
    const refreshAuthState = jest
      .fn()
      .mockResolvedValue(createAuthState('new-access-token', 1));
    request.mockRejectedValue(createAxiosError(status));

    const result = await new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    }).request({
      url: '/protected',
    });

    expect(result).toMatchObject({
      isError: true,
      status,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(refreshAuthState).not.toHaveBeenCalled();
  });

  it('refreshes a protected 401 and retries once with the new access token', async () => {
    const { client, request } = createClient();
    const failedAuthState = createAuthState('expired-token', 12);
    const refreshedAuthState = createAuthState('new-access-token', 13);
    const getAuthState = jest
      .fn()
      .mockResolvedValueOnce(failedAuthState)
      .mockResolvedValue(refreshedAuthState);
    const refreshAuthState = jest.fn().mockResolvedValue(refreshedAuthState);
    request
      .mockRejectedValueOnce(createAxiosError(401))
      .mockResolvedValueOnce(createSuccessResponse({ url: '/auth/me' }));

    const result = await new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    }).request<SuccessPayload>({
      url: '/auth/me',
    });

    expect(result).toEqual({
      data: {
        url: '/auth/me',
      },
      isError: false,
      message: '',
    });
    expect(request).toHaveBeenCalledTimes(2);
    expect(refreshAuthState).toHaveBeenCalledTimes(1);
    expect(refreshAuthState).toHaveBeenCalledWith(failedAuthState);
    expect(getRequestHeaders(request, 0).get('Authorization')).toBe('Bearer expired-token');
    expect(getRequestHeaders(request, 1).get('Authorization')).toBe('Bearer new-access-token');
  });

  it('returns a second 401 without starting another refresh', async () => {
    const { client, request } = createClient();
    const failedAuthState = createAuthState('expired-token');
    const refreshedAuthState = createAuthState('new-access-token', 1);
    const getAuthState = jest
      .fn()
      .mockResolvedValueOnce(failedAuthState)
      .mockResolvedValue(refreshedAuthState);
    const refreshAuthState = jest.fn().mockResolvedValue(refreshedAuthState);
    request.mockRejectedValue(createAxiosError(401));

    const result = await new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    }).request({
      url: '/protected',
    });

    expect(result).toMatchObject({
      isError: true,
      status: 401,
    });
    expect(request).toHaveBeenCalledTimes(2);
    expect(refreshAuthState).toHaveBeenCalledTimes(1);
    expect(getRequestHeaders(request, 1).get('Authorization')).toBe('Bearer new-access-token');
  });

  it('does not refresh when the auth snapshot could not be read for the failed request', async () => {
    const { client, request } = createClient();
    const getAuthState = jest.fn().mockRejectedValue(new Error('Keychain unavailable'));
    const refreshAuthState = jest
      .fn()
      .mockResolvedValue(createAuthState('new-account-token', 2));
    request.mockRejectedValue(createAxiosError(401));

    const result = await new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    }).request({
      url: '/protected',
    });

    expect(result).toMatchObject({
      isError: true,
      status: 401,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(refreshAuthState).not.toHaveBeenCalled();
  });

  it('does not retry an old request after the auth session changes again', async () => {
    const { client, request } = createClient();
    const failedAuthState = createAuthState('expired-token', 4);
    const refreshedAuthState = createAuthState('refreshed-token', 5);
    const newerLoginState = createAuthState('new-account-token', 6);
    const getAuthState = jest
      .fn()
      .mockResolvedValueOnce(failedAuthState)
      .mockResolvedValueOnce(newerLoginState);
    const refreshAuthState = jest.fn().mockResolvedValue(refreshedAuthState);
    request.mockRejectedValue(createAxiosError(401));

    const result = await new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    }).request({
      url: '/protected',
    });

    expect(result).toMatchObject({
      isError: true,
      status: 401,
    });
    expect(refreshAuthState).toHaveBeenCalledWith(failedAuthState);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('lets three 401 responses join one supplied single-flight refresh operation', async () => {
    const { client, request } = createClient();
    const expiredAuthState = createAuthState('expired-token');
    const refreshedAuthState = createAuthState('new-access-token', 1);
    let currentAuthState = expiredAuthState;
    const getAuthState = jest.fn(async () => currentAuthState);
    let activeRefresh: Promise<IRequesterAuthState> | null = null;
    let resolveRefresh: ((authState: IRequesterAuthState) => void) | undefined;
    const refreshOperation = jest.fn(() => {
      return new Promise<IRequesterAuthState>((resolve) => {
        resolveRefresh = resolve;
      });
    });
    const refreshAuthState = jest.fn(() => {
      if (!activeRefresh) {
        activeRefresh = refreshOperation().finally(() => {
          activeRefresh = null;
        });
      }

      return activeRefresh;
    });

    request.mockImplementation(async (config: AxiosRequestConfig) => {
      const headers = AxiosHeaders.from(
        config.headers as RawAxiosHeaders | AxiosHeaders | undefined,
      );

      if (headers.get('Authorization') === 'Bearer expired-token') {
        throw createAxiosError(401);
      }

      return createSuccessResponse({
        url: config.url ?? '',
      });
    });

    const requester = new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    });
    const pendingRequests = ['/one', '/two', '/three'].map((url) => {
      return requester.request<SuccessPayload>({ url });
    });

    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    expect(refreshAuthState).toHaveBeenCalledTimes(3);
    expect(refreshOperation).toHaveBeenCalledTimes(1);

    currentAuthState = refreshedAuthState;
    resolveRefresh?.(refreshedAuthState);

    const results = await Promise.all(pendingRequests);
    const authorizations = request.mock.calls.map((call) => {
      const config = call[0] as AxiosRequestConfig;
      const headers = AxiosHeaders.from(
        config.headers as RawAxiosHeaders | AxiosHeaders | undefined,
      );

      return headers.get('Authorization');
    });

    expect(results.map((result) => result.data?.url)).toEqual(['/one', '/two', '/three']);
    expect(request).toHaveBeenCalledTimes(6);
    expect(authorizations.filter((value) => value === 'Bearer expired-token')).toHaveLength(3);
    expect(authorizations.filter((value) => value === 'Bearer new-access-token')).toHaveLength(3);
  });

  it('never refreshes recursively when a refresh-endpoint request returns 401', async () => {
    const { client, request } = createClient();
    const getAuthState = jest.fn().mockResolvedValue(createAuthState('access-token'));
    const refreshAuthState = jest
      .fn()
      .mockResolvedValue(createAuthState('new-access-token', 1));
    request.mockRejectedValue(createAxiosError(401));

    const result = await new AxiosRequester(client, {
      getAuthState,
      refreshAuthState,
    }).request({
      requiresAuth: false,
      skipAuthRefresh: true,
      url: '/auth/refresh',
    });

    expect(result).toMatchObject({
      isError: true,
      status: 401,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(getAuthState).not.toHaveBeenCalled();
    expect(refreshAuthState).not.toHaveBeenCalled();
  });
});
