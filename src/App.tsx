import { AppProviders } from '@/AppProviders';
import { initializeAppEnvironment } from '@/entities/environment/services/appEnvironmentService';
import { initializeTokenRefreshService } from '@/entities/user/services/tokenRefreshService';
import { RootNavigation } from '@/navigation/RootNavigation';

initializeAppEnvironment();
initializeTokenRefreshService();

export const App = () => {
  return (
    <AppProviders>
      <RootNavigation />
    </AppProviders>
  );
};
