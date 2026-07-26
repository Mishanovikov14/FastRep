import { AppProviders } from '@/AppProviders';
import { RootNavigation } from '@/navigation/RootNavigation';

export const App = () => {
  return (
    <AppProviders>
      <RootNavigation />
    </AppProviders>
  );
};
