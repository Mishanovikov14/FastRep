import { AppProviders } from '@/AppProviders';
import { initializeTokenRefreshService } from '@/modules/auth/services/tokenRefreshService';
import { RootNavigation } from '@/navigation/RootNavigation';

initializeTokenRefreshService();

export const App = () => {
  return (
    <AppProviders>
      <RootNavigation />
    </AppProviders>
  );
};
