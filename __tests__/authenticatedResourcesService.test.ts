import { clearAuthenticatedResources } from '@/entities/user/services/authenticatedResourcesService';
import { queryClient } from '@/libs/query/QueryClient';

jest.mock('@/libs/query/QueryClient', () => ({
  queryClient: {
    cancelQueries: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn(),
  },
}));

describe('clearAuthenticatedResources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cancels in-flight authenticated queries before clearing cached data', async () => {
    await clearAuthenticatedResources();

    expect(queryClient.cancelQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(jest.mocked(queryClient.cancelQueries).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(queryClient.clear).mock.invocationCallOrder[0],
    );
  });

  it('still clears cached data when query cancellation fails', async () => {
    jest.mocked(queryClient.cancelQueries).mockRejectedValueOnce(new Error('Cancellation failed'));

    await expect(clearAuthenticatedResources()).rejects.toThrow('Cancellation failed');

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });
});
