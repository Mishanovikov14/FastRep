import { AppProviders } from '@/AppProviders';
import { RootNavigation } from '@/navigation/RootNavigation';

export default function App() {
  return (
    <AppProviders>
      <RootNavigation />
    </AppProviders>
  );
}
