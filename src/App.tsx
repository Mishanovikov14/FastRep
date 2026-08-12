import { AppProviders } from '@/AppProviders';
import { initializeAppEnvironment } from '@/entities/environment/services/appEnvironmentService';
import { initializeTokenRefreshService } from '@/entities/user/services/tokenRefreshService';
import { RootNavigation } from '@/navigation/RootNavigation';
import { StatusBar } from 'react-native';

initializeAppEnvironment();
initializeTokenRefreshService();

export const App = () => {
  
  return (
    <AppProviders>
      <RootNavigation />
      <StatusBar translucent barStyle={'dark-content'} />
    </AppProviders>
  );
};
