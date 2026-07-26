import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { restoreAuthSession } from '@/modules/auth/services/authSessionService';
import { useSplashViewPresenter } from '@/modules/home/ui/SplashView/presenters/useSplashViewPresenter';
import { useAuthStore } from '@/storage/authStore';
import type { IUser } from '@/types/auth';

jest.mock('@/modules/auth/services/authSessionService', () => ({
  restoreAuthSession: jest.fn(),
}));

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
  clearUser: useAuthStore.getState().clearUser,
  setSessionRestored: useAuthStore.getState().setSessionRestored,
  setUser: useAuthStore.getState().setUser,
};
const mockClearUser = jest.fn();
const mockSetSessionRestored = jest.fn();
const mockSetUser = jest.fn();
const waitForAsyncWork = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('useSplashViewPresenter', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    useSplashViewPresenter();

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    renderer = undefined;
    useAuthStore.setState({
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
      useAuthStore.setState({
        ...originalActions,
        isAuthorized: false,
        isSessionRestored: false,
        user: null,
      });
    });
  });

  it('restores an authorized user once, including under Strict Mode effects', async () => {
    jest.mocked(restoreAuthSession).mockResolvedValue({
      isAuthorized: true,
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

    expect(restoreAuthSession).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenCalledWith(user);
    expect(mockClearUser).not.toHaveBeenCalled();
    expect(mockSetSessionRestored).toHaveBeenCalledTimes(1);
    expect(mockSetSessionRestored).toHaveBeenCalledWith(true);
  });

  it('clears the user and completes restoration for an unauthorized session', async () => {
    jest.mocked(restoreAuthSession).mockResolvedValue({
      isAuthorized: false,
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
      await waitForAsyncWork();
    });

    expect(restoreAuthSession).toHaveBeenCalledTimes(1);
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockSetSessionRestored).toHaveBeenCalledTimes(1);
    expect(mockSetSessionRestored).toHaveBeenCalledWith(true);
  });

  it('clears the user and completes restoration after an unexpected error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    jest.mocked(restoreAuthSession).mockRejectedValue(new Error('restore failed'));

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
      await waitForAsyncWork();
    });

    expect(restoreAuthSession).toHaveBeenCalledTimes(1);
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockClearUser).toHaveBeenCalledTimes(1);
    expect(mockSetSessionRestored).toHaveBeenCalledTimes(1);
    expect(mockSetSessionRestored).toHaveBeenCalledWith(true);

    consoleError.mockRestore();
  });
});
