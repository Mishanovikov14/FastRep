import { useAuthSessionLifecycle } from '@/hooks/useAuthSessionLifecycle';

export const AppLifecycle = () => {
  useAuthSessionLifecycle();

  return null;
};
