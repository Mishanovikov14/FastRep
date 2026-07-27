import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useUserStore } from '@/entities/user/model/userStore';
import { restoreUserSession } from '@/entities/user/services/userSessionService';
import type { SessionRestoreResult } from '@/entities/user/types/session';
import type { IUser } from '@/entities/user/types/user';
import { useSplashViewPresenter } from '@/modules/home/ui/SplashView/presenters/useSplashViewPresenter';

jest.mock('@/entities/user/services/userSessionService', () => ({
  restoreUserSession: jest.fn(),
}));

interface IDeferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
}

const createDeferred = <T,>(): IDeferred<T> => {
  let onResolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    onResolve = resolve;
  });

  return {
    promise,
    resolve: onResolve,
  };
};

const t = ((key: string) => key) as unknown as TFunction;
const user: IUser = {
  createdAt: '2026-07-26T10:00:00.000Z',
  email: 'alex@example.com',
  fullName: 'Alex Morgan',
  id: 'user-1',
  isPremium: false,
  language: 'en',
  photoUrl: null,
  updatedAt: '2026-07-26T10:00:00.000Z',
};
const originalActions = {
  clearUser: useUserStore.getState().clearUser,
  setSessionRestored: useUserStore.getState().setSessionRestored,
  setUser: useUserStore.getState().setUser,
};
const mockClearUser = jest.fn();
const mockSetSessionRestored = jest.fn();
const mockSetUser = jest.fn();
const waitForAsyncWork = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('useSplashViewPresenter', () => {
  let presenter: ReturnType<typeof useSplashViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useSplashViewPresenter({ t });

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    presenter = undefined;
    renderer = undefined;
    useUserStore.setState({
      clearUser: mockClearUser,
      isAuthorized: false,
      isSessionRestored: false,
      setSessionRestored: mockSetSessionRestored,
      setUser: mockSetUser,
      user: null,
    });
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
      useUserStore.setState({
        ...originalActions,
        isAuthorized: false,
        isSessionRestored: false,
        user: null,
      });
    });
  });

  it('updates the user and completes authorized restoration once under Strict Mode', async () => {
    jest.mocked(restoreUserSession).mockResolvedValue({
      status: 'authorized',
      user,
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <React.StrictMode>
          <Harness />
        </React.StrictMode>,
      );
      await waitForAsyncWork();
    });

    expect(restoreUserSession).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenCalledWith(user);
    expect(mockClearUser).not.toHaveBeenCalled();
    expect(mockSetSessionRestored).toHaveBeenLastCalledWith(true);
    expect(presenter?.hasTemporaryError).toBe(false);
  });

  it('clears the user and completes restoration for an unauthorized session', async () => {
    jest.mocked(restoreUserSession).mockResolvedValue({
      status: 'unauthorized',
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
      await waitForAsyncWork();
    });

    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockSetSessionRestored).toHaveBeenLastCalledWith(true);
  });

  it('keeps restoration unresolved and exposes Retry after a temporary error', async () => {
    jest.mocked(restoreUserSession).mockResolvedValue({
      message: 'Service unavailable',
      status: 'temporary_error',
      statusCode: 503,
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
      await waitForAsyncWork();
    });

    expect(mockClearUser).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockSetSessionRestored).not.toHaveBeenCalledWith(true);
    expect(presenter).toMatchObject({
      errorMessage: 'auth.session.serverError',
      hasTemporaryError: true,
      isLoading: false,
    });
  });

  it('prevents duplicate Retry calls and completes a successful Retry', async () => {
    jest.mocked(restoreUserSession).mockResolvedValueOnce({
      status: 'temporary_error',
      type: 'network_error',
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
      await waitForAsyncWork();
    });

    const retryDeferred = createDeferred<SessionRestoreResult>();
    jest.mocked(restoreUserSession).mockReturnValueOnce(retryDeferred.promise);

    let firstRetry: Promise<void> | undefined;
    let duplicateRetry: Promise<void> | undefined;

    await ReactTestRenderer.act(async () => {
      firstRetry = presenter?.onRetry();
      duplicateRetry = presenter?.onRetry();
      await duplicateRetry;
    });

    expect(restoreUserSession).toHaveBeenCalledTimes(2);

    retryDeferred.resolve({
      status: 'authorized',
      user,
    });

    await ReactTestRenderer.act(async () => {
      await firstRetry;
    });

    expect(mockSetUser).toHaveBeenCalledWith(user);
    expect(mockSetSessionRestored).toHaveBeenLastCalledWith(true);
    expect(presenter?.hasTemporaryError).toBe(false);
  });
});
