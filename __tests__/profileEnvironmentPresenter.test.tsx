import type { TFunction } from 'i18next';
import ReactTestRenderer from 'react-test-renderer';

import { APP_ENVIRONMENTS } from '@/entities/environment/config/appEnvironments';
import { useAppEnvironmentStore } from '@/entities/environment/model/appEnvironmentStore';
import { useUserStore } from '@/entities/user/model/userStore';
import { switchAppEnvironment } from '@/entities/user/services/environmentSwitchService';
import { useLogout } from '@/hooks/useLogout';
import { useProfileViewPresenter } from '@/modules/profile/ui/ProfileView/presenters/useProfileViewPresenter';

jest.mock('@/hooks/useLogout', () => ({
  useLogout: jest.fn(),
}));

jest.mock('@/entities/user/services/environmentSwitchService', () => ({
  switchAppEnvironment: jest.fn(),
}));

const t = ((key: string, options?: { environment?: string }) => {
  return options?.environment ? `${key}:${options.environment}` : key;
}) as unknown as TFunction;

let presenter: ReturnType<typeof useProfileViewPresenter> | undefined;
let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

const PresenterHarness = () => {
  presenter = useProfileViewPresenter({ t });

  return null;
};

const owner = {
  createdAt: '2026-01-01T00:00:00.000Z',
  email: '  Mishanovikov14@GMAIL.COM ',
  fullName: 'Owner',
  id: 'owner',
  isPremium: true,
  language: 'en' as const,
  photoUrl: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Profile environment presenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    presenter = undefined;
    jest.mocked(useLogout).mockReturnValue({
      isLoading: false,
      onLogout: jest.fn(),
    });
    jest.mocked(switchAppEnvironment).mockResolvedValue({
      environment: APP_ENVIRONMENTS.development,
      status: 'changed',
    });
    useAppEnvironmentStore.getState().setActiveEnvironment('production');
    useAppEnvironmentStore.getState().setIsSwitching(false);
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
  });

  it('exposes the Profile environment control only for the normalized owner account', () => {
    useUserStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user: owner,
    });

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PresenterHarness />);
    });

    expect(presenter?.isOwner).toBe(true);

    ReactTestRenderer.act(() => {
      useUserStore.getState().setUser({
        ...owner,
        email: 'runner@fastrep.dev',
      });
    });

    expect(presenter?.isOwner).toBe(false);
  });

  it('requires confirmation before switching environments', async () => {
    useUserStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user: owner,
    });

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PresenterHarness />);
    });

    ReactTestRenderer.act(() => {
      presenter?.onOpenEnvironmentSelection();
    });

    const developmentAction = presenter?.environmentAlertActions.find((action) => action.key === 'development');

    ReactTestRenderer.act(() => {
      developmentAction?.onPress();
    });

    expect(switchAppEnvironment).not.toHaveBeenCalled();
    expect(presenter?.environmentAlertTitle).toBe('profile.environment.confirmationTitle');

    const switchAction = presenter?.environmentAlertActions.find((action) => action.key === 'switch');

    await ReactTestRenderer.act(async () => {
      switchAction?.onPress();
      await Promise.resolve();
    });

    expect(switchAppEnvironment).toHaveBeenCalledWith({
      currentUserEmail: owner.email,
      targetEnvironment: 'development',
    });
  });
});
