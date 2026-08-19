import { useAuthSessionLifecycle } from '@/hooks/useAuthSessionLifecycle';
import { useReactQueryAppLifecycle } from '@/hooks/useReactQueryAppLifecycle';

export const AppLifecycle = () => {
  useAuthSessionLifecycle();
  useReactQueryAppLifecycle();

  return null;
};
