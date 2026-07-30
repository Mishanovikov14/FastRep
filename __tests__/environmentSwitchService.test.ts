import { useAppEnvironmentStore } from '@/entities/environment/model/appEnvironmentStore';
import { clearAuthenticatedResources } from '@/entities/user/services/authenticatedResourcesService';
import { useUserStore } from '@/entities/user/model/userStore';
import { switchAppEnvironment } from '@/entities/user/services/environmentSwitchService';
import { clearUserSession } from '@/entities/user/services/userStateService';
import { getRootNavigationState } from '@/navigation/getRootNavigationState';

jest.mock('@/entities/user/services/authenticatedResourcesService', () => ({
  clearAuthenticatedResources: jest.fn(),
}));

jest.mock('@/entities/user/services/userStateService', () => ({
  clearUserSession: jest.fn(),
}));

describe('switchAppEnvironment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppEnvironmentStore.getState().setActiveEnvironment('production');
    useAppEnvironmentStore.getState().setIsSwitching(false);
    useUserStore.setState({
      isAuthorized: true,
      isSessionRestored: true,
      user: {
        createdAt: '2026-01-01T00:00:00.000Z',
        email: 'mishanovikov14@gmail.com',
        fullName: 'Owner',
        id: 'owner',
        isPremium: true,
        language: 'en',
        photoUrl: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    jest.mocked(clearUserSession).mockImplementation(async () => {
      useUserStore.getState().resetUser();
    });
    jest.mocked(clearAuthenticatedResources).mockResolvedValue();
  });

  it('clears tokens, session state, and server caches before declarative guest navigation', async () => {
    const result = await switchAppEnvironment({
      currentUserEmail: 'mishanovikov14@gmail.com',
      targetEnvironment: 'development',
    });

    expect(result.status).toBe('changed');
    expect(clearUserSession).toHaveBeenCalledTimes(1);
    expect(clearAuthenticatedResources).toHaveBeenCalledTimes(1);
    expect(jest.mocked(clearUserSession).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(clearAuthenticatedResources).mock.invocationCallOrder[0],
    );
    expect(
      getRootNavigationState({
        isAuthorized: useUserStore.getState().isAuthorized,
        isSessionRestored: useUserStore.getState().isSessionRestored,
      }),
    ).toBe('guest');
  });

  it('does nothing when the owner selects the already active environment', async () => {
    const result = await switchAppEnvironment({
      currentUserEmail: 'mishanovikov14@gmail.com',
      targetEnvironment: 'production',
    });

    expect(result.status).toBe('unchanged');
    expect(clearUserSession).not.toHaveBeenCalled();
    expect(clearAuthenticatedResources).not.toHaveBeenCalled();
  });

  it('logs the owner out when switching from Development to Production', async () => {
    useAppEnvironmentStore.getState().setActiveEnvironment('development');

    const result = await switchAppEnvironment({
      currentUserEmail: 'mishanovikov14@gmail.com',
      targetEnvironment: 'production',
    });

    expect(result).toMatchObject({
      environment: {
        key: 'production',
      },
      status: 'changed',
    });
    expect(clearUserSession).toHaveBeenCalledTimes(1);
    expect(clearAuthenticatedResources).toHaveBeenCalledTimes(1);
  });

  it('does not log out a non-owner whose rejected Development request remains on Production', async () => {
    const result = await switchAppEnvironment({
      currentUserEmail: 'runner@fastrep.dev',
      targetEnvironment: 'development',
    });

    expect(result.status).toBe('rejected');
    expect(clearUserSession).not.toHaveBeenCalled();
    expect(clearAuthenticatedResources).not.toHaveBeenCalled();
  });
});
