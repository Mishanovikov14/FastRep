import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './QueryClient';
import type { IProps } from './types';

export const ReactQueryProvider = ({ children }: IProps) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
