import { queryClient } from '@/libs/query/QueryClient';

export const clearAuthenticatedResources = async (): Promise<void> => {
  try {
    await queryClient.cancelQueries();
  } finally {
    queryClient.clear();
  }

  // Future authenticated-resource cleanup extension points:
  // socket disconnect; notification unsubscribe and delivered-notification cleanup;
  // report upload queue cleanup; temporary file cleanup; authenticated feature-store reset.
};
