import { QueryClient } from '@tanstack/react-query';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 0,
    },
    queries: {
      gcTime: 30 * MINUTE,
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * MINUTE,
    },
  },
});
