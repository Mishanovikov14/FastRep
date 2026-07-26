import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReactQueryProvider } from '@/libs/query';
import { ToastHost } from '@/libs/toast';
import { UIProvider } from '@/UIProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <UIProvider>
          <ReactQueryProvider>
            {children}
            <ToastHost />
          </ReactQueryProvider>
        </UIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
