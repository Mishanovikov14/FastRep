import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { useUserStore } from '@/entities/user/model/userStore';
import { userTokenStorage } from '@/entities/user/services/userTokenStorage';
import type { IAuthenticationResponse, ILoginRequest } from '@/entities/user/types/auth';
import type { IUser } from '@/entities/user/types/user';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import { useLoginViewPresenter } from '@/modules/auth/ui/LoginView/presenters/useLoginViewPresenter';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));
jest.mock('@/entities/user/services/userTokenStorage', () => ({
  userTokenStorage: {
    clearTokens: jest.fn(),
    getTokens: jest.fn(),
    saveTokens: jest.fn(),
  },
}));
jest.mock('@/libs/toast/toastService', () => ({
  toastService: {
    showError: jest.fn(),
  },
}));
jest.mock('@/entities/user/API/userApi', () => ({
  login: jest.fn(),
}));

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
const authentication: IAuthenticationResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user,
};
const originalSetUser = useUserStore.getState().setUser;
const mockMutateAsync = jest.fn();
const mockSetUser = jest.fn();
const waitForAsyncWork = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('useLoginViewPresenter', () => {
  const navigation = {
    navigate: jest.fn(),
  };
  let presenter: ReturnType<typeof useLoginViewPresenter> | undefined;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  const Harness = () => {
    presenter = useLoginViewPresenter({ t });

    return null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    presenter = undefined;
    renderer = undefined;
    useUserStore.setState({
      isAuthorized: false,
      isSessionRestored: false,
      setUser: mockSetUser,
      user: null,
    });
    jest.mocked(useNavigation).mockReturnValue(navigation as never);
    jest.mocked(useMutation).mockReturnValue({
      isPending: false,
      mutateAsync: mockMutateAsync,
    } as never);
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
      useUserStore.setState({
        isAuthorized: false,
        isSessionRestored: false,
        setUser: originalSetUser,
        user: null,
      });
    });
  });

  it('saves the token pair before the user and blocks a duplicate login submission', async () => {
    const events: string[] = [];
    let resolveResponse: ((response: IResponse<IAuthenticationResponse>) => void) | undefined;
    const responsePromise = new Promise<IResponse<IAuthenticationResponse>>((resolve) => {
      resolveResponse = resolve;
    });

    jest.mocked(userTokenStorage.saveTokens).mockImplementation(async () => {
      events.push('tokens');
    });
    mockSetUser.mockImplementation((nextUser: IUser) => {
      events.push('user');
      originalSetUser(nextUser);
    });
    mockMutateAsync.mockReturnValue(responsePromise);

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeEmail('  ALEX@EXAMPLE.COM ');
      presenter?.onChangePassword('password123');
    });

    await ReactTestRenderer.act(async () => {
      presenter?.onSubmit();
      presenter?.onSubmit();
      await waitForAsyncWork();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'password123',
    } satisfies ILoginRequest);

    await ReactTestRenderer.act(async () => {
      resolveResponse?.({
        data: authentication,
        isError: false,
        message: '',
      });
      await responsePromise;
      await waitForAsyncWork();
    });

    expect(userTokenStorage.saveTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(mockSetUser).toHaveBeenCalledWith(user);
    expect(events).toEqual(['tokens', 'user']);
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: true,
      user,
    });
  });

  it('does not save tokens or set the user when login fails', async () => {
    mockMutateAsync.mockResolvedValue({
      isError: true,
      message: 'Invalid credentials',
      status: 401,
    });

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onChangeEmail('alex@example.com');
      presenter?.onChangePassword('password123');
    });

    await ReactTestRenderer.act(async () => {
      presenter?.onSubmit();
      await waitForAsyncWork();
    });

    expect(userTokenStorage.saveTokens).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(useUserStore.getState()).toMatchObject({
      isAuthorized: false,
      user: null,
    });
    expect(toastService.showError).toHaveBeenCalledWith('common.error', 'auth.login.invalidCredentials');
  });

  it('opens Registration and the real password-recovery flow', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<Harness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onPressRegistration();
      presenter?.onPressForgotPassword();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('Registration');
    expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
