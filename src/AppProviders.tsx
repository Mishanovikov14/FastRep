import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReactQueryProvider } from '@/API/ReactQueryProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
